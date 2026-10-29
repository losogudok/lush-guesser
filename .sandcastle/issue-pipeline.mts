import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import type { Sandbox } from "@ai-hero/sandcastle";
import { z } from "zod";
import { agents } from "./runtime.mts";
import { hasEligibleIssue } from "./runner-loop.mts";

export type Issue = { id: string; title: string; branch: string };
const explanation = {
  reason: z.string().trim().min(1),
  evidence: z.array(z.string().trim().min(1)).min(1),
};
const humanRequestSchema = z.object({
  ...explanation,
  decision: z.enum(["needs-info", "needs-triage"]),
  question: z.string().trim().min(1),
});
const alreadyResolvedSchema = z.object({
  ...explanation,
  decision: z.literal("already-resolved"),
  maintainerCommentUrl: z.string().url(),
});
const validationSchema = z.union([
  z.object({ ...explanation, decision: z.literal("implement") }),
  z.object({ ...explanation, decision: z.literal("skip") }),
  alreadyResolvedSchema,
  humanRequestSchema,
]);
export type HumanRequest = z.infer<typeof humanRequestSchema>;
type PipelineResult = {
  status: "completed" | "already-resolved" | "skipped" | HumanRequest["decision"];
  commits: { sha: string }[];
};

function readDecision<T>(stdout: string, tag: string, schema: z.ZodType<T>): T {
  const matches = [...stdout.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g"))];
  if (matches.length !== 1) throw new Error(`Expected exactly one <${tag}> decision`);
  return schema.parse(JSON.parse(matches[0]![1]!));
}

function githubOptions() {
  const envFile = new URL(".env", import.meta.url);
  const configured = existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")) : {};
  const env = { ...process.env };
  for (const [key, value] of Object.entries(configured)) env[key] = value || env[key];
  return { env, encoding: "utf8" as const, timeout: 30_000 };
}

function failureSummary(error: unknown): string {
  let summary = (error instanceof Error ? `${error.name}: ${error.message}` :
    typeof error === "string" ? error : "Unknown execution error").split(/\r?\n/, 1)[0]!;
  // Provider errors can contain credentials; publish a short diagnostic, never
  // raw output or a stack trace. The full run remains available in the local log.
  for (const [key, value] of Object.entries(githubOptions().env)) {
    if (/(TOKEN|PASSWORD|SECRET|KEY|AUTH|PROXY)/i.test(key) && value && value.length >= 4) {
      summary = summary.split(value).join("<REDACTED>");
    }
  }
  return summary
    .replace(/\b(https?|socks5h?):\/\/[^\s/@]+@/gi, "$1://<REDACTED>@")
    .replace(/\bBearer\s+[^\s,;]+/gi, "Bearer <REDACTED>")
    .replace(/\b((?:password|token|api[_-]?key|secret)\s*[=:]\s*)[^\s,;]+/gi, "$1<REDACTED>")
    .slice(0, 500);
}

// Validation handoffs use typed decisions; agents only report them.
export function requestHuman(issue: Issue, request: HumanRequest): void {
  const options = githubOptions();
  const current = JSON.parse(execFileSync("gh", [
    "issue", "view", issue.id, "--json", "state,assignees,labels",
  ], options));
  // Avoid changing an issue that a human or another worker has already taken.
  if (current.state !== "OPEN" || !hasEligibleIssue([current])) return;

  // Remove eligibility first, so a failed comment cannot schedule another run.
  execFileSync("gh", [
    "issue", "edit", issue.id, "--remove-label", "ready-for-agent", "--add-label", request.decision,
  ], options);
  const body = [
    "<!-- sandcastle:human-required -->",
    "Sandcastle paused this issue for human input. It will not be merged or closed while awaiting that input.",
    `Reason: ${request.reason}`,
    "Evidence:",
    ...request.evidence.map(item => `- ${item}`),
    `Question: ${request.question}`,
    "After answering, resolve blockers, remove conflicting triage labels, and restore ready-for-agent to retry.",
    "If the issue is already implemented, a maintainer can confirm that here and restore ready-for-agent for verification and closure, or close it as completed directly.",
  ].join("\n\n");
  execFileSync("gh", ["issue", "comment", issue.id, "--body-file", "-"], { ...options, input: body });
}

function closeResolvedIssue(issue: Issue, resolution: z.infer<typeof alreadyResolvedSchema>): "already-resolved" | "skipped" {
  const options = githubOptions();
  const current = JSON.parse(execFileSync("gh", [
    "issue", "view", issue.id, "--json", "state,assignees,labels,comments",
  ], options));
  // A maintainer may have closed or reclassified the issue during validation.
  if (current.state !== "OPEN" || !hasEligibleIssue([current])) return "skipped";

  const confirmation = current.comments.find((comment: { url: string; authorAssociation: string; body: string }) =>
    comment.url === resolution.maintainerCommentUrl &&
    ["OWNER", "MEMBER", "COLLABORATOR"].includes(comment.authorAssociation) &&
    comment.body.trim() && !comment.body.includes("<!-- sandcastle:"));
  if (!confirmation) throw new Error(`Issue ${issue.id}: maintainer confirmation is missing or invalid; no GitHub changes made.`);

  const body = [
    "<!-- sandcastle:already-resolved -->",
    "Already implemented; verified by Sandcastle against the starting base.",
    `Reason: ${resolution.reason}`,
    `Maintainer confirmation: ${resolution.maintainerCommentUrl}`,
    "Evidence:",
    ...resolution.evidence.map(item => `- ${item}`),
  ].join("\n\n");
  execFileSync("gh", ["issue", "close", issue.id, "--reason", "completed", "--comment", body], options);
  execFileSync("gh", ["issue", "edit", issue.id, "--remove-label", "ready-for-agent"], options);
  return "already-resolved";
}

export async function runIssuePipeline(
  sandbox: Pick<Sandbox, "run" | "exec">,
  issue: Issue,
  reviewBase: string,
  notifyHuman: (issue: Issue, request: HumanRequest) => void | Promise<void> = requestHuman,
  signal?: AbortSignal,
): Promise<PipelineResult> {
  signal?.throwIfAborted();
  const pause = async (request: HumanRequest): Promise<PipelineResult> => {
    signal?.throwIfAborted();
    await notifyHuman(issue, request);
    console.log(`${issue.id}: ${request.decision} — ${request.reason}`);
    return { status: request.decision, commits: [] };
  };
  const executionFailure = (stage: string, reason: string, error?: unknown): HumanRequest => ({
    decision: "needs-triage",
    reason: `${stage}: ${reason}`,
    evidence: [
      ...(error === undefined ? [] : [`Failure: ${failureSummary(error)}`]),
      `Inspect .sandcastle/logs/${issue.branch.replaceAll("/", "-")}-${stage}.log for the full run.`,
      "Automatic processing stopped. Partial work is excluded from merging and must be reviewed before retrying.",
    ],
    question: `After reviewing the ${stage} failure and any partial work, should this issue be retried with ready-for-agent or handed to a human with ready-for-human?`,
  });
  const promptArgs = { TASK_ID: issue.id, ISSUE_TITLE: issue.title, BRANCH: issue.branch, REVIEW_BASE: reviewBase };

  let result;
  let worktreeStatus;
  try {
    result = await sandbox.run({
      name: "validator", maxIterations: 1, agent: agents.planner,
      signal,
      promptFile: "./.sandcastle/validate-prompt.md", promptArgs,
    });
    worktreeStatus = await sandbox.exec("git status --porcelain");
  } catch (error) {
    signal?.throwIfAborted();
    return pause(executionFailure("validator", "Execution or worktree inspection failed.", error));
  }
  if (worktreeStatus.exitCode !== 0 || result.commits.length > 0 || worktreeStatus.stdout.trim()) {
    return pause({
      decision: "needs-triage",
      reason: "Validation changed the worktree or could not prove it stayed unchanged.",
      evidence: [`Inspect branch ${issue.branch}; validator commits and local changes are excluded from merging.`],
      question: "Can you review the validator's changes and confirm whether this issue should proceed?",
    });
  }
  let validation;
  try { validation = readDecision(result.stdout, "validation", validationSchema); }
  catch (error) { return pause(executionFailure("validator", "Validation output was missing, malformed, or unsupported.", error)); }

  if (validation.decision === "skip") {
    console.log(`${issue.id}: skipped — ${validation.reason}`);
    return { status: "skipped", commits: [] };
  }
  if (validation.decision === "already-resolved") {
    signal?.throwIfAborted();
    const status = closeResolvedIssue(issue, validation);
    console.log(`${issue.id}: ${status} — ${validation.reason}`);
    return { status, commits: [] };
  }
  if (validation.decision !== "implement") return pause(validation);

  const commits: { sha: string }[] = [];
  for (const stage of ["implementer", "reviewer"] as const) {
    let result;
    try {
      result = await sandbox.run({
        name: stage, maxIterations: stage === "implementer" ? 100 : 1,
        signal,
        completionSignal: ["<promise>COMPLETE</promise>", "</human-required>"],
        agent: agents[stage], promptFile: `./.sandcastle/${stage === "implementer" ? "implement" : "review"}-prompt.md`,
        promptArgs,
      });
    } catch (error) { signal?.throwIfAborted(); return pause(executionFailure(stage, "Execution failed before confirmed completion.", error)); }
    if (result.stdout.includes("<human-required>")) {
      let request;
      try { request = readDecision(result.stdout, "human-required", humanRequestSchema); }
      catch (error) { request = executionFailure(stage, "The human handoff was malformed or unsupported.", error); }
      return pause(request);
    }
    if (result.completionSignal !== "<promise>COMPLETE</promise>") return pause(executionFailure(stage, "The required completion signal was not returned."));
    commits.push(...result.commits);
    if (stage === "implementer" && commits.length === 0) return pause({
      decision: "needs-triage",
      reason: "Implementation reported completion without a committed change.",
      evidence: [`The approved issue produced no new commits on ${issue.branch}.`],
      question: "Is this issue already resolved, or what change is still required?",
    });
  }
  return { status: "completed", commits };
}
