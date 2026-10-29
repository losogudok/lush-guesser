import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Sandbox, SandboxRunOptions, SandboxRunResult } from "@ai-hero/sandcastle";
import { requestHuman, runIssuePipeline, type HumanRequest } from "./issue-pipeline.mts";

const issue = { id: "42", title: "Correct the score", branch: "sandcastle/issue-42" };
type AgentReply = Partial<SandboxRunResult>;
type Reply = AgentReply | Error;
const decision = (value: Record<string, unknown>, tag = "validation"): AgentReply => ({
  stdout: `<${tag}>${JSON.stringify(value)}</${tag}>`,
});
const approved = () => decision({
  decision: "implement", reason: "The base still has the reported defect.",
  evidence: ["Existing score regression check fails at the starting base."],
});
const completed = (sha: string): AgentReply => ({
  stdout: "<promise>COMPLETE</promise>", completionSignal: "<promise>COMPLETE</promise>", commits: [{ sha }],
});
const confirmation = {
  url: "https://github.com/losogudok/lush-guesser/issues/42#issuecomment-123",
  authorAssociation: "OWNER", body: "#42 is implemented",
};
const resolved = {
  decision: "already-resolved", reason: "The starting base satisfies the acceptance criteria.",
  evidence: ["The base contains the score fix and the existing regression check passes."],
  maintainerCommentUrl: confirmation.url,
};

type GithubIssue = {
  state: string; assignees: readonly unknown[]; labels: readonly { name: string }[];
  comments: readonly typeof confirmation[];
};
const readyIssue = (): GithubIssue => ({
  state: "OPEN", assignees: [], labels: [{ name: "ready-for-agent" }], comments: [confirmation],
});

async function withGithubIssue(
  current: GithubIssue,
  check: (calls: () => string[][], update: (issue: GithubIssue) => void) => Promise<void>,
  failOperation = "",
) {
  const directory = mkdtempSync(join(tmpdir(), "sandcastle-resolution-"));
  const logFile = join(directory, "calls.jsonl");
  const stateFile = join(directory, "issue.json");
  const previousPath = process.env.PATH;
  writeFileSync(stateFile, JSON.stringify(current));
  writeFileSync(logFile, "");
  writeFileSync(join(directory, "gh"), `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(logFile)}, JSON.stringify(args) + '\\n');
if (args[1] === ${JSON.stringify(failOperation)}) process.exit(1);
const stateFile = ${JSON.stringify(stateFile)};
const current = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
if (args[1] === 'view') process.stdout.write(JSON.stringify(current));
if (args[1] === 'close') current.state = 'CLOSED';
if (args[1] === 'edit') current.labels = current.labels.filter(label => label.name !== args[args.indexOf('--remove-label') + 1]);
fs.writeFileSync(stateFile, JSON.stringify(current));
`, { mode: 0o700 });
  try {
    process.env.PATH = `${directory}:${previousPath}`;
    await check(
      () => readFileSync(logFile, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line)),
      updated => writeFileSync(stateFile, JSON.stringify(updated)),
    );
  } finally {
    process.env.PATH = previousPath;
    rmSync(directory, { recursive: true, force: true });
  }
}

function fixture(replies: Reply[], dirty = false) {
  const calls: SandboxRunOptions[] = [];
  const requests: HumanRequest[] = [];
  const sandbox: Pick<Sandbox, "run" | "exec"> = {
    async run(options) {
      calls.push(options);
      const reply = replies.shift();
      if (!reply) throw new Error("Unexpected agent invocation");
      if (reply instanceof Error) throw reply;
      return { iterations: [], stdout: "", commits: [], ...reply };
    },
    async exec() { return { exitCode: 0, stdout: dirty ? " M score.ts\n" : "", stderr: "" }; },
  };
  const run = () => runIssuePipeline(sandbox, issue, "starting-commit", (_issue, request) => { requests.push(request); });
  return { run, calls, requests };
}

test("a verified issue reaches implementation and review, preserving both sets of commits", async () => {
  const f = fixture([approved(), completed("implementation"), completed("review")]);
  assert.deepEqual(await f.run(), { status: "completed", commits: [{ sha: "implementation" }, { sha: "review" }] });
  assert.deepEqual(f.calls.map(call => call.name), ["validator", "implementer", "reviewer"]);
  assert.equal(f.calls[2]!.promptArgs!.REVIEW_BASE, "starting-commit");
  assert.equal("TARGET_BRANCH" in f.calls[2]!.promptArgs!, false);
  assert.deepEqual(f.calls[1]!.completionSignal, ["<promise>COMPLETE</promise>", "</human-required>"]);
  assert.equal(f.requests.length, 0);
});

for (const label of ["needs-info", "needs-triage"] as const) {
  test(`${label} requests a human and never invokes implementation or review`, async () => {
    const request = {
      decision: label, reason: "The current behavior may already satisfy the request.",
      evidence: ["score.ts already implements the described calculation."],
      question: "Which remaining scenario is incorrect?",
    };
    const f = fixture([decision(request)]);
    assert.deepEqual(await f.run(), { status: label, commits: [] });
    assert.deepEqual(f.calls.map(call => call.name), ["validator"]);
    assert.deepEqual(f.requests, [request]);
  });
}

test("a newly assigned or blocked issue is skipped without changing GitHub", async () => {
  const f = fixture([decision({ decision: "skip", reason: "A blocking issue is still open.", evidence: ["#41 is open."] })]);
  assert.deepEqual(await f.run(), { status: "skipped", commits: [] });
  assert.equal(f.calls.length, 1);
  assert.equal(f.requests.length, 0);
});

test("a maintainer answer resolves a previously paused issue without repeating the question or implementing", async () => {
  await withGithubIssue({ ...readyIssue(), comments: [] }, async (calls, update) => {
    const request = {
      decision: "needs-triage", reason: "The feature appears to be implemented.",
      evidence: ["The starting base already contains the score fix."], question: "Is this issue implemented?",
    };
    const f = fixture([decision(request), decision(resolved), decision(resolved)]);
    assert.deepEqual(await f.run(), { status: "needs-triage", commits: [] });
    // The owner answers the handoff and restores ready-for-agent before retrying.
    update(readyIssue());
    assert.deepEqual(await f.run(), { status: "already-resolved", commits: [] });
    assert.deepEqual(f.requests, [request]);
    assert.deepEqual(f.calls.map(call => call.name), ["validator", "validator"]);
    assert.deepEqual(calls().map(args => args[1]), ["view", "close", "edit"]);
    const close = calls()[1]!;
    assert.deepEqual(close.slice(0, 6), ["issue", "close", "42", "--reason", "completed", "--comment"]);
    assert.match(close[6]!, /starting base/);
    assert.match(close[6]!, /<!-- sandcastle:already-resolved -->/);
    assert.ok(close[6]!.includes(confirmation.url));
    assert.ok(close[6]!.includes(resolved.evidence[0]!));
    assert.deepEqual(calls()[2], ["issue", "edit", "42", "--remove-label", "ready-for-agent"]);

    // A stale/retried resolution after closure must only read the issue.
    assert.deepEqual(await f.run(), { status: "skipped", commits: [] });
    assert.deepEqual(calls().map(args => args[1]), ["view", "close", "edit", "view"]);
    assert.deepEqual(f.requests, [request]);
  });
});

for (const [name, current] of [
  ["already closed by the owner", { ...readyIssue(), state: "CLOSED" }],
  ["newly assigned", { ...readyIssue(), assignees: [{ login: "maintainer" }] }],
  ["removed from the queue", { ...readyIssue(), labels: [] }],
  ["reclassified", { ...readyIssue(), labels: [{ name: "ready-for-agent" }, { name: "needs-triage" }] }],
] as const) {
  test(`resolution leaves an issue ${name} unchanged`, async () => {
    await withGithubIssue(current, async calls => {
      const f = fixture([decision(resolved)]);
      assert.deepEqual(await f.run(), { status: "skipped", commits: [] });
      assert.deepEqual(calls().map(args => args[1]), ["view"]);
      assert.equal(f.requests.length, 0);
    });
  });
}

for (const [name, comments] of [
  ["missing confirmation", []],
  ["non-maintainer comment", [{ ...confirmation, authorAssociation: "NONE" }]],
  ["pipeline handoff", [{ ...confirmation, body: "<!-- sandcastle:human-required --> Already implemented?" }]],
  ["pipeline closure", [{ ...confirmation, body: "<!-- sandcastle:already-resolved --> Already implemented." }]],
] as const) {
  test(`resolution rejects ${name} without writing to GitHub or repeating a question`, async () => {
    await withGithubIssue({ ...readyIssue(), comments: [...comments] }, async calls => {
      const f = fixture([decision(resolved)]);
      await assert.rejects(f.run(), /maintainer confirmation/i);
      assert.deepEqual(calls().map(args => args[1]), ["view"]);
      assert.equal(f.calls.length, 1);
      assert.equal(f.requests.length, 0);
    });
  });
}

test("a failed GitHub closure does not remove eligibility or post another question", async () => {
  await withGithubIssue(readyIssue(), async calls => {
    const f = fixture([decision(resolved)]);
    await assert.rejects(f.run());
    assert.deepEqual(calls().map(args => args[1]), ["view", "close"]);
    assert.equal(f.requests.length, 0);
  }, "close");
});

for (const [name, reply] of [
  ["missing decision", { stdout: "Looks fine" }],
  ["malformed JSON", { stdout: "<validation>{broken}</validation>" }],
  ["unsupported decision", decision({ decision: "close", reason: "Done", evidence: ["Already fixed"] })],
  ["approval without evidence", decision({ decision: "implement", reason: "Probably valid", evidence: [] })],
  ["resolution without evidence", decision({ ...resolved, evidence: [] })],
  ["resolution without maintainer confirmation", decision({ ...resolved, maintainerCommentUrl: undefined })],
  ["human request without a question", decision({ decision: "needs-info", reason: "Unclear", evidence: ["No reproduction"] })],
  ["conflicting decisions", { stdout: `${approved().stdout}${approved().stdout}` }],
  ["validator failure", new Error("Provider unavailable")],
] as const) {
  test(`${name} fails closed and requests human input`, async () => {
    const f = fixture([reply]);
    assert.deepEqual(await f.run(), { status: "needs-info", commits: [] });
    assert.equal(f.calls.length, 1);
    assert.equal(f.requests.length, 1);
  });
}

test("validator commits cannot be passed into implementation or merging", async () => {
  const f = fixture([{ ...approved(), commits: [{ sha: "unexpected" }] }]);
  assert.deepEqual(await f.run(), { status: "needs-triage", commits: [] });
  assert.equal(f.calls.length, 1);
});

test("validator file changes require human review", async () => {
  const f = fixture([approved()], true);
  assert.deepEqual(await f.run(), { status: "needs-triage", commits: [] });
  assert.equal(f.calls.length, 1);
});

test("doubt discovered during implementation excludes partial commits from merging", async () => {
  const request = {
    decision: "needs-triage", reason: "The requested behavior contradicts the approved rules.",
    evidence: ["The ADR requires the existing behavior."], question: "Should the ADR change?",
  };
  const f = fixture([approved(), { ...decision(request, "human-required"), commits: [{ sha: "partial" }] }]);
  assert.deepEqual(await f.run(), { status: "needs-triage", commits: [] });
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.requests, [request]);
});

test("an incomplete implementer cannot merge merely because it made commits", async () => {
  const f = fixture([approved(), { stdout: "Still working", commits: [{ sha: "partial" }] }]);
  assert.deepEqual(await f.run(), { status: "needs-info", commits: [] });
  assert.equal(f.calls.length, 2);
});

test("an approved issue with no implementation commits asks a human instead of silently skipping", async () => {
  const f = fixture([approved(), { ...completed("unused"), commits: [] }]);
  assert.deepEqual(await f.run(), { status: "needs-triage", commits: [] });
  assert.equal(f.calls.length, 2);
});

test("a provider failure during implementation pauses the issue", async () => {
  const f = fixture([approved(), new Error("Provider unavailable")]);
  assert.deepEqual(await f.run(), { status: "needs-info", commits: [] });
  assert.equal(f.requests.length, 1);
});

test("reviewer doubts exclude implementation and review commits", async () => {
  const request = {
    decision: "needs-info", reason: "The acceptance criteria are ambiguous.",
    evidence: ["The issue gives conflicting expected scores."], question: "Which score is expected?",
  };
  const f = fixture([approved(), completed("implementation"), decision(request, "human-required")]);
  assert.deepEqual(await f.run(), { status: "needs-info", commits: [] });
  assert.equal(f.calls.length, 3);
});

test("a malformed late handoff cannot be treated as completion", async () => {
  const f = fixture([approved(), { ...completed("partial"), stdout: "<human-required>{bad}</human-required>" }]);
  assert.deepEqual(await f.run(), { status: "needs-info", commits: [] });
});

test("a failed human notification propagates without a second notification or implementation", async () => {
  let attempts = 0;
  const sandbox: Pick<Sandbox, "run" | "exec"> = {
    async run() { return { iterations: [], stdout: '<validation>{"decision":"needs-info","reason":"Unknown","evidence":["No steps"],"question":"What steps?"}</validation>', commits: [] }; },
    async exec() { return { exitCode: 0, stdout: "", stderr: "" }; },
  };
  await assert.rejects(runIssuePipeline(sandbox, issue, "base", () => { attempts++; throw new Error("GitHub unavailable"); }), /GitHub unavailable/);
  assert.equal(attempts, 1);
});

test("operator cancellation does not relabel an issue or ask for clarification", async () => {
  const stop = new AbortController();
  let requests = 0;
  const sandbox: Pick<Sandbox, "run" | "exec"> = {
    async run(options) {
      assert.equal(options.signal, stop.signal);
      stop.abort(new Error("Operator stopped the runner"));
      throw stop.signal.reason;
    },
    async exec() { throw new Error("Unexpected worktree check after cancellation"); },
  };
  await assert.rejects(runIssuePipeline(sandbox, issue, "base", () => { requests++; }, stop.signal), /Operator stopped/);
  assert.equal(requests, 0);
});

test("GitHub handoff removes eligibility before commenting, and does not close or assign", () => {
  const directory = mkdtempSync(join(tmpdir(), "sandcastle-handoff-"));
  const logFile = join(directory, "calls.jsonl");
  const previousPath = process.env.PATH;
  const current = { state: "OPEN", assignees: [], labels: [{ name: "ready-for-agent" }] };
  writeFileSync(join(directory, "gh"), `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const body = args[1] === 'comment' ? fs.readFileSync(0, 'utf8') : '';
fs.appendFileSync(${JSON.stringify(logFile)}, JSON.stringify({args, body}) + '\\n');
if (args[1] === 'view') process.stdout.write(${JSON.stringify(JSON.stringify(current))});
`, { mode: 0o700 });
  try {
    process.env.PATH = `${directory}:${previousPath}`;
    requestHuman(issue, {
      decision: "needs-info", reason: "Missing reproduction", evidence: ["No steps in the issue"],
      question: "What steps reproduce this?",
    });
    const calls = readFileSync(logFile, "utf8").trim().split("\n").map(line => JSON.parse(line));
    assert.deepEqual(calls.map(call => call.args[1]), ["view", "edit", "comment"]);
    assert.deepEqual(calls[1].args, ["issue", "edit", "42", "--remove-label", "ready-for-agent", "--add-label", "needs-info"]);
    assert.deepEqual(calls[2].args, ["issue", "comment", "42", "--body-file", "-"]);
    assert.match(calls[2].body, /What steps reproduce this\?/);
    assert.match(calls[2].body, /No steps in the issue/);
  } finally {
    process.env.PATH = previousPath;
    rmSync(directory, { recursive: true, force: true });
  }
});
