import assert from "node:assert/strict";
import { test } from "node:test";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertExpectedBranch, hasEligibleIssue, loopOptions, parallelIssueLimit, QueueReadError, readPlanningIssues, runLoop } from "./runner-loop.mts";

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

test("finite runs keep their cycle limit and do not poll", async () => {
  const iterations: number[] = [];
  await runLoop(loopOptions({ SANDCASTLE_MAX_ITERATIONS: "3" }), {
    async runCycle(iteration) { iterations.push(iteration); return iteration === 1 ? "idle" : "progress"; },
    hasWork() { throw new Error("Finite mode must not poll"); },
    async wait() { throw new Error("Finite mode must not wait"); },
  });
  assert.deepEqual(iterations, [1, 2, 3]);
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
        writeFileSync(join(directory, "gh"), '#!/usr/bin/env node\nprocess.stdout.write(\'[{"number":42,"comments":["Human clarification"]}]\');\n', { mode: 0o700 });
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
    hasWork() { throw new Error("Unexpected preflight"); },
    async runCycle() { throw failure; },
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
    script: `if (process.argv.includes("assignees,labels")) {
      process.stdout.write('[{"assignees":[],"labels":[{"name":"ready-for-agent"}]}]');
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
