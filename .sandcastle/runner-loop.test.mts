import assert from "node:assert/strict";
import { test } from "node:test";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertExpectedBranch, blockingReferences, hasEligibleIssue, hasReadyIssues, loopOptions, parallelIssueLimit, QueueReadError, readPlanningIssues, runLoop } from "./runner-loop.mts";

const continuous = loopOptions({ SANDCASTLE_MAX_ITERATIONS: "infinite", SANDCASTLE_POLL_INTERVAL_SECONDS: "10" });

test("parallel issue limits and the configured service branch are enforced", () => {
  assert.equal(parallelIssueLimit({}), 2);
  assert.equal(parallelIssueLimit({ SANDCASTLE_MAX_PARALLEL_ISSUES: "1" }), 1);
  for (const value of ["0", "33", "1.5", "bad"]) assert.throws(() => parallelIssueLimit({ SANDCASTLE_MAX_PARALLEL_ISSUES: value }));
  assert.doesNotThrow(() => assertExpectedBranch("dev", "dev"));
  assert.doesNotThrow(() => assertExpectedBranch(undefined, "main"));
  assert.throws(() => assertExpectedBranch("dev", "main"), /expected branch dev/);
  assert.throws(() => assertExpectedBranch("dev", ""), /detached HEAD/);
});

test("one cycle remains the default; infinite mode and polling are explicit", () => {
  assert.deepEqual(loopOptions({}), { maxIterations: 1, pollIntervalMs: 60_000 });
  assert.deepEqual(continuous, { maxIterations: Infinity, pollIntervalMs: 10_000 });
  for (const value of ["0", "-1", "1.5", "Infinity", "bad"]) {
    assert.throws(() => loopOptions({ SANDCASTLE_MAX_ITERATIONS: value }), /positive integer or/);
  }
  for (const value of ["0", "-1", "1.5", "86401", "bad"]) {
    assert.throws(() => loopOptions({ SANDCASTLE_POLL_INTERVAL_SECONDS: value }), /between 1 and 86400/);
  }
});

test("new issues need ready-for-agent, no assignee, and no conflicting triage label", () => {
  const issue = { assignees: [], labels: [{ name: "needs-triage" }] };
  assert.equal(hasEligibleIssue([issue]), false);
  issue.labels = [{ name: "ready-for-agent" }];
  assert.equal(hasEligibleIssue([issue]), true);
  assert.equal(hasEligibleIssue([{ ...issue, assignees: [{}] }]), false);
  for (const name of ["needs-triage", "needs-info", "ready-for-human", "wontfix"]) {
    assert.equal(hasEligibleIssue([{ ...issue, labels: [...issue.labels, { name }] }]), false);
  }
});

test("finite runs check the queue before each cycle, keep their limit, and do not wait", async () => {
  const iterations: number[] = [];
  let checks = 0;
  await runLoop(loopOptions({ SANDCASTLE_MAX_ITERATIONS: "3" }), {
    async runCycle(iteration) { iterations.push(iteration); return iteration === 1 ? "idle" : "progress"; },
    hasWork() { checks++; return true; },
    async wait() { throw new Error("Finite mode must not wait"); },
  });
  assert.deepEqual(iterations, [1, 2, 3]);
  assert.equal(checks, 3);
});

test("a finite run with no eligible work exits without starting a model or waiting", async () => {
  await runLoop(loopOptions({}), {
    hasWork: () => false, log() {},
    async runCycle() { throw new Error("Unexpected agent invocation"); },
    async wait() { throw new Error("Unexpected polling"); },
  });
});

test("finite mode exits early when the planner finds no unblocked work", async () => {
  let cycles = 0;
  await runLoop(loopOptions({ SANDCASTLE_MAX_ITERATIONS: "3" }), {
    async runCycle() { cycles++; return "empty"; },
    hasWork: () => true,
  });
  assert.equal(cycles, 1);
});

test("continuous mode waits without model calls, then acts when a new issue becomes ready", async () => {
  const stop = new AbortController();
  const issues: { assignees: unknown[]; labels: { name: string }[] }[] = [];
  const intervals: number[] = [];
  const iterations: number[] = [];
  await runLoop(continuous, {
    signal: stop.signal, log() {},
    hasWork: () => hasEligibleIssue(issues),
    async wait(milliseconds) {
      intervals.push(milliseconds);
      if (intervals.length === 1) issues.push({ assignees: [], labels: [{ name: "needs-triage" }] });
      else if (intervals.length === 2) issues[0]!.labels = [{ name: "ready-for-agent" }];
      else throw new Error("Unexpected extra polling");
    },
    async runCycle(iteration) { iterations.push(iteration); stop.abort(); return "progress"; },
  });
  assert.deepEqual(intervals, [10_000, 10_000]);
  assert.deepEqual(iterations, [1]);
});

test("continuous mode waits after an empty plan instead of exiting or spinning", async () => {
  const stop = new AbortController();
  let cycles = 0;
  let waits = 0;
  await runLoop(continuous, {
    signal: stop.signal, log() {}, hasWork: () => true,
    async runCycle() { return ++cycles === 1 ? "empty" : (stop.abort(), "progress"); },
    async wait(milliseconds) { assert.equal(milliseconds, 10_000); waits++; },
  });
  assert.equal(cycles, 2);
  assert.equal(waits, 1);
});

test("a batch with no merged branches is backed off", async () => {
  const stop = new AbortController();
  let waits = 0;
  await runLoop(continuous, {
    signal: stop.signal, log() {}, hasWork: () => true,
    async runCycle() { return "idle"; },
    async wait() { waits++; stop.abort(); },
  });
  assert.equal(waits, 1);
});

test("GitHub read failures retry after a delay without starting a model", async () => {
  const stop = new AbortController();
  let checks = 0;
  let cycles = 0;
  let waits = 0;
  await runLoop(continuous, {
    signal: stop.signal, log() {},
    hasWork() { if (++checks === 1) throw new Error("GitHub unavailable"); return true; },
    async wait() { waits++; },
    async runCycle() { cycles++; stop.abort(); return "progress"; },
  });
  assert.equal(checks, 2);
  assert.equal(cycles, 1);
  assert.equal(waits, 1);
});

test("a merge-cycle error stops continuous mode rather than retrying a partial merge", async () => {
  let calls = 0;
  await assert.rejects(runLoop(continuous, {
    hasWork: () => true,
    async runCycle() { calls++; throw new Error("Merge failed"); },
    async wait() { throw new Error("Unexpected retry"); },
  }), /Merge failed/);
  assert.equal(calls, 1);
});

test("a TLS failure loading planner issues retries before starting an agent", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sandcastle-planning-read-"));
  const previousPath = process.env.PATH;
  const logs: string[] = [];
  let cycles = 0;
  let models = 0;
  let waits = 0;
  const stop = new AbortController();
  writeFileSync(join(directory, "gh"), '#!/usr/bin/env node\nprocess.stderr.write(\'Post "https://api.github.com/graphql": net/http: TLS handshake timeout\');\nprocess.exit(1);\n', { mode: 0o700 });
  process.env.PATH = `${directory}:${previousPath}`;
  try {
    await runLoop(continuous, {
      signal: stop.signal, hasWork: () => true, log: message => logs.push(message),
      async runCycle() {
        cycles++;
        assert.equal(JSON.parse(readPlanningIssues()).length, 1);
        models++;
        stop.abort();
        return "progress";
      },
      async wait(milliseconds) {
        assert.equal(milliseconds, continuous.pollIntervalMs);
        waits++;
        assert.equal(models, 0);
        writeFileSync(join(directory, "gh"), '#!/usr/bin/env node\nprocess.stdout.write(\'[{"number":42,"assignees":[],"labels":[{"name":"ready-for-agent"}],"comments":[{"body":"Human clarification"}]}]\');\n', { mode: 0o700 });
      },
    });
    assert.equal(cycles, 2);
    assert.equal(models, 1);
    assert.equal(waits, 1);
    assert.match(logs.join("\n"), /TLS handshake timeout/);
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
    rmSync(directory, { recursive: true, force: true });
  }
});

test("a finite run reports a planner issue-read failure without retrying", async () => {
  const failure = new QueueReadError(new Error("TLS handshake timeout"));
  await assert.rejects(runLoop(loopOptions({}), {
    hasWork: () => true,
    async runCycle() { throw failure; },
    async wait() { throw new Error("Unexpected retry"); },
  }), error => error === failure);
});

test("a finite run reports a queue-read failure without starting a model or retrying", async () => {
  const failure = new QueueReadError(new Error("GitHub unavailable"));
  await assert.rejects(runLoop(loopOptions({}), {
    hasWork() { throw failure; },
    async runCycle() { throw new Error("Unexpected agent invocation"); },
    async wait() { throw new Error("Unexpected retry"); },
  }), error => error === failure);
});

test("aborting cancels the real idle timer immediately", { timeout: 1000 }, async () => {
  const stop = new AbortController();
  setImmediate(() => stop.abort());
  await runLoop(continuous, {
    signal: stop.signal, log() {}, hasWork: () => false,
    async runCycle() { throw new Error("Unexpected agent invocation"); },
  });
});

test("a pre-aborted loop does not read GitHub or start agents", async () => {
  await runLoop(continuous, {
    signal: AbortSignal.abort(),
    hasWork() { throw new Error("Unexpected GitHub call"); },
    async runCycle() { throw new Error("Unexpected agent invocation"); },
  });
});

for (const scenario of [
  { name: "the queue is empty", output: "No eligible issues.", script: "process.stdout.write('[]');" },
  {
    name: "the planner issue read times out",
    output: "Planner issue list unavailable.",
    script: `if (process.argv.includes("number,body,assignees,labels")) {
      process.stdout.write('[{"number":42,"body":"","assignees":[],"labels":[{"name":"ready-for-agent"}]}]');
    } else if (process.argv[2] === "repo") {
      process.stdout.write('losogudok/lush-guesser');
    } else if (process.argv[2] === "api") {
      process.stdout.write('[[]]');
    } else {
      process.stderr.write('Post "https://api.github.com/graphql": net/http: TLS handshake timeout');
      process.exit(1);
    }`,
  },
]) test(`the actual watch entrypoint exits on Ctrl+C while ${scenario.name}`, { timeout: 10_000 }, async () => {
  const directory = mkdtempSync(join(tmpdir(), "sandcastle-watch-"));
  writeFileSync(join(directory, "gh"), `#!/usr/bin/env node\n${scenario.script}\n`, { mode: 0o700 });
  const child = spawn(process.execPath, ["--import", "tsx", ".sandcastle/main.mts"], {
    env: { ...process.env, PATH: `${directory}:${process.env.PATH}`, SANDCASTLE_MAX_ITERATIONS: "infinite" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  let interrupted = false;
  const deadline = setTimeout(() => child.kill("SIGKILL"), 5000);
  try {
    child.stdout.on("data", chunk => {
      output += chunk.toString();
      if (!interrupted && output.includes(scenario.output)) { interrupted = true; child.kill("SIGINT"); }
    });
    child.stderr.on("data", chunk => { output += chunk.toString(); });
    const code = await new Promise<number | null>((resolve, reject) => {
      child.on("error", reject);
      child.on("close", resolve);
    });
    assert.equal(code, 130, output);
    assert.equal(interrupted, true);
    assert.match(output, /Stopped\./);
    assert.doesNotMatch(output, /\[planner\] Started/);
  } finally {
    clearTimeout(deadline);
    child.kill("SIGKILL");
    rmSync(directory, { recursive: true, force: true });
  }
});

test("explicit blockers support inline declarations, sections, and other repositories", () => {
  const body = [
    "Related to #99", "```md", "Blocked by: #98", "```",
    "Blocked by: #19, #20", "", "## Blocked by", "",
    "- #20", "- other/project#3", "- https://github.com/other/project/issues/4",
    "## Related work", "- #97",
  ].join("\n");
  assert.deepEqual(blockingReferences(body, "losogudok/lush-guesser"), [
    { repository: "losogudok/lush-guesser", number: 19 },
    { repository: "losogudok/lush-guesser", number: 20 },
    { repository: "other/project", number: 3 },
    { repository: "other/project", number: 4 },
  ]);
  assert.deepEqual(blockingReferences("Blocked by:\n\n- #20\n\nRelated to #99", "owner/repo"), [
    { repository: "owner/repo", number: 20 },
  ]);
});

const readyCandidate = (number: number, body = "") => ({
  number, body, title: `Issue ${number}`, assignees: [] as unknown[],
  labels: [{ name: "ready-for-agent" }], comments: [{ body: "Human clarification" }],
});
type QueueFixture = {
  issues: ReturnType<typeof readyCandidate>[];
  planningIssues?: ReturnType<typeof readyCandidate>[];
  states?: Record<string, string>;
  native?: Record<string, { state: string }[][]>;
  fail?: string;
};

async function withQueue(fixture: QueueFixture, check: (calls: () => string[][], update: (next: QueueFixture) => void) => Promise<void>) {
  const directory = mkdtempSync(join(tmpdir(), "sandcastle-queue-"));
  const fixtureFile = join(directory, "queue.json");
  const callsFile = join(directory, "calls.jsonl");
  const previousPath = process.env.PATH;
  writeFileSync(fixtureFile, JSON.stringify(fixture));
  writeFileSync(callsFile, "");
  writeFileSync(join(directory, "gh"), `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(callsFile)}, JSON.stringify(args) + '\\n');
const fixture = JSON.parse(fs.readFileSync(${JSON.stringify(fixtureFile)}, 'utf8'));
if (fixture.fail === args.slice(0, 2).join(' ') || fixture.fail === args[0]) {
  process.stderr.write('GitHub unavailable'); process.exit(1);
}
if (args[0] === 'issue' && args[1] === 'list') {
  const issues = args.includes('number,title,body,labels,comments,assignees') ? fixture.planningIssues ?? fixture.issues : fixture.issues;
  process.stdout.write(JSON.stringify(issues));
}
else if (args[0] === 'repo') process.stdout.write('losogudok/lush-guesser');
else if (args[0] === 'issue' && args[1] === 'view') {
  const key = args[args.indexOf('--repo') + 1] + '#' + args[2];
  process.stdout.write(fixture.states?.[key] ?? 'OPEN');
} else if (args[0] === 'api') {
  const number = args.at(-1).split('/')[4];
  process.stdout.write(JSON.stringify(fixture.native?.[number] ?? [[]]));
} else process.exit(2);
`, { mode: 0o700 });
  try {
    process.env.PATH = `${directory}:${previousPath}`;
    await check(
      () => readFileSync(callsFile, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line)),
      next => writeFileSync(fixtureFile, JSON.stringify(next)),
    );
  } finally {
    if (previousPath === undefined) delete process.env.PATH;
    else process.env.PATH = previousPath;
    rmSync(directory, { recursive: true, force: true });
  }
}

test("empty and ineligible queues need no dependency requests", async () => {
  await withQueue({ issues: [] }, async (calls, update) => {
    assert.equal(hasReadyIssues(), false);
    update({ issues: [
      { ...readyCandidate(1), assignees: [{}] },
      { ...readyCandidate(2), labels: [{ name: "needs-triage" }] },
      { ...readyCandidate(3), labels: [{ name: "ready-for-agent" }, { name: "needs-info" }] },
    ] });
    assert.equal(hasReadyIssues(), false);
    assert.equal(readPlanningIssues(), "[]");
    assert.ok(calls().every(args => args[0] === "issue" && args[1] === "list"));
  });
});

test("shared open body blockers prevent a cycle and are refreshed after closure", async () => {
  const fixture = { issues: [readyCandidate(21, "## Blocked by\n\n- #20"), readyCandidate(22, "Blocked by: #20")] };
  await withQueue(fixture, async (calls, update) => {
    assert.equal(hasReadyIssues(), false);
    assert.equal(calls().filter(args => args[1] === "view" && args[0] === "issue").length, 1);
    assert.equal(calls().some(args => args[0] === "api"), false);
    update({ ...fixture, states: { "losogudok/lush-guesser#20": "CLOSED" } });
    assert.equal(hasReadyIssues(), true);
  });
});

test("cross-repository blockers are resolved in their own repositories", async () => {
  await withQueue({ issues: [readyCandidate(21, "Blocked by: other/project#20")] }, async calls => {
    assert.equal(hasReadyIssues(), false);
    assert.ok(calls().some(args => args[0] === "issue" && args[1] === "view" && args.includes("other/project")));
  });
});

test("native blockers on later pages prevent work until every blocker closes", async () => {
  const fixture = { issues: [readyCandidate(21)], native: { "21": [[{ state: "closed" }], [{ state: "open" }]] } };
  await withQueue(fixture, async (calls, update) => {
    assert.equal(hasReadyIssues(), false);
    update({ ...fixture, native: { "21": [[{ state: "closed" }], [{ state: "closed" }]] } });
    assert.equal(hasReadyIssues(), true);
    assert.ok(calls().filter(args => args[0] === "api").every(args => args.includes("--paginate") && args.includes("--slurp")));
  });
});

test("independent work can proceed while another candidate is blocked", async () => {
  await withQueue({ issues: [readyCandidate(21, "Blocked by: #20"), readyCandidate(22)] }, async () => {
    assert.equal(hasReadyIssues(), true);
    const planned = JSON.parse(readPlanningIssues());
    assert.equal(planned.length, 2);
    assert.deepEqual(planned[1].labels, ["ready-for-agent"]);
    assert.deepEqual(planned[1].comments, ["Human clarification"]);
  });
});

test("an open candidate blocks its dependents without another state request", async () => {
  await withQueue({ issues: [readyCandidate(22, "Blocked by: #21"), readyCandidate(21, "Blocked by: #20")] }, async calls => {
    assert.equal(hasReadyIssues(), false);
    assert.equal(calls().filter(args => args[0] === "issue" && args[1] === "view").length, 1);
    assert.ok(calls().some(args => args[0] === "issue" && args[1] === "view" && args[2] === "20"));
  });
});

for (const fail of ["issue list", "repo view", "issue view", "api"]) {
  test(`GitHub ${fail} failure prevents model calls`, async () => {
    await withQueue({ issues: [readyCandidate(21, fail === "issue view" ? "Blocked by: #20" : "")], fail }, async () => {
      await assert.rejects(runLoop(loopOptions({}), {
        hasWork: hasReadyIssues,
        async runCycle() { throw new Error("Unexpected agent invocation"); },
      }), QueueReadError);
    });
  });
}

for (const scenario of [
  { name: "an empty queue", fixture: { issues: [] } },
  { name: "open body blockers", fixture: { issues: [readyCandidate(21, "## Blocked by\n\n- #20")] } },
  { name: "open native blockers", fixture: { issues: [readyCandidate(21)], native: { "21": [[{ state: "open" }]] } } },
  { name: "a queue emptied after preflight", fixture: { issues: [readyCandidate(21)], planningIssues: [] } },
]) test(`the actual one-shot entrypoint skips the planner for ${scenario.name}`, { timeout: 10_000 }, async () => {
  await withQueue(scenario.fixture, async () => {
    const child = spawn(process.execPath, ["--import", "tsx", ".sandcastle/main.mts"], {
      env: { ...process.env, SANDCASTLE_MAX_ITERATIONS: "1", SANDCASTLE_EXPECTED_BRANCH: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const deadline = setTimeout(() => child.kill("SIGKILL"), 5000);
    try {
      child.stdout.on("data", chunk => { output += chunk.toString(); });
      child.stderr.on("data", chunk => { output += chunk.toString(); });
      const code = await new Promise<number | null>((resolve, reject) => {
        child.on("error", reject);
        child.on("close", resolve);
      });
      assert.equal(code, 0, output);
      assert.match(output, /No eligible issues\./);
      assert.match(output, /All done\./);
      assert.doesNotMatch(output, /\[planner\] Started/);
    } finally {
      clearTimeout(deadline);
      child.kill("SIGKILL");
    }
  });
});
