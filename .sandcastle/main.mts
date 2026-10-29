// Parallel Planner with Review — Sandcastle orchestration loop for Lush Guesser
//
// This template drives a multi-phase workflow:
//   Phase 1 (Plan):             An agent analyzes open issues, builds a
//                               dependency graph, and outputs a <plan> JSON
//                               listing unblocked issues with branch names.
//   Phase 2 (Validate + Code):  For each issue, a sandbox is created via
//                               createSandbox(). A validator runs before coding.
//                               The implementer then runs
//                               (100 iterations). If it produces commits, a
//                               reviewer runs in the same sandbox on the same
//                               branch (1 iteration). All issue pipelines run
//                               concurrently via Promise.allSettled().
//   Phase 3 (Merge):            A single agent merges all completed branches
//                               into the current branch.
//
// The outer loop can run a fixed number of cycles or poll continuously.
//
// Usage:
//   pnpm exec tsx .sandcastle/main.mts
// Or add to package.json:
//   "scripts": { "sandcastle": "tsx .sandcastle/main.mts" }

import * as sandcastle from "@ai-hero/sandcastle";
import { z } from "zod";
import { execFileSync } from "node:child_process";
import { agents, hooks, sandboxProvider } from "./runtime.mts";
import { runIssuePipeline } from "./issue-pipeline.mts";
import { assertExpectedBranch, hasReadyIssues, loopOptions, parallelIssueLimit, runLoop } from "./runner-loop.mts";

// The planner emits its plan as JSON inside <plan> tags; Output.object extracts
// and validates it against this schema. We use Zod here, but any Standard
// Schema validator works just as well — Valibot, ArkType, etc. See
// https://standardschema.dev.
const planSchema = z.object({
  issues: z.array(
    z.object({
      id: z.string().regex(/^[1-9]\d*$/),
      title: z.string(),
      branch: z.string().regex(/^sandcastle\/issue-[1-9]\d*$/),
    }).refine(issue => issue.branch === `sandcastle/issue-${issue.id}`, "Issue branch must match its ID"),
  ),
});
type PlannedIssue = z.infer<typeof planSchema>["issues"][number];

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`Usage: pnpm run sandcastle

Runs Sandcastle against unassigned GitHub Issues labeled "ready-for-agent".

Setup:
  pnpm run sandcastle:build-image
  cp .sandcastle/.env.example .sandcastle/.env
  pnpm run sandcastle:check

Environment:
  SANDCASTLE_MAX_ITERATIONS=1
  SANDCASTLE_MAX_ITERATIONS=infinite (continuous GitHub polling)
  SANDCASTLE_POLL_INTERVAL_SECONDS=60
  SANDCASTLE_MAX_PARALLEL_ISSUES=2
  SANDCASTLE_CONTAINER_CPUS=<optional CPUs per container>
  SANDCASTLE_PLANNER_MODEL=gpt-6.1-sol (Codex, high)
  SANDCASTLE_IMPLEMENTER_MODEL=opencode-go/kimi-k3.1-pro (OpenCode Go)
  SANDCASTLE_REVIEWER_MODEL=gpt-6.1-sol (Codex, high)
  SANDCASTLE_MERGER_MODEL=gpt-6.1-sol (Codex, medium)
  SANDCASTLE_CODEX_AUTH_FILE=<host CODEX_HOME/auth.json>
  SANDCASTLE_IMAGE_NAME=lush-guesser-sandcastle
  SANDCASTLE_TARGET_BRANCH=<starting HEAD commit>
`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const options = loopOptions();
const parallelLimit = parallelIssueLimit();
const stop = new AbortController();
const interrupt = () => { process.exitCode = 130; stop.abort(new Error("Interrupted")); };
const terminate = () => { process.exitCode = 143; stop.abort(new Error("Terminated")); };

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function runCycle(iteration: number): Promise<"empty" | "idle" | "progress"> {
  checkBranch();
  const limit = options.maxIterations === Infinity ? "infinite" : options.maxIterations;
  console.log(`\n=== Iteration ${iteration}/${limit} ===\n`);
  // Resolve for each batch, so reviews exclude changes merged in earlier cycles.
  const TARGET_BRANCH = execFileSync("git", [
    "rev-parse", "--verify", `${process.env.SANDCASTLE_TARGET_BRANCH ?? "HEAD"}^{commit}`,
  ], { encoding: "utf8" }).trim();

  // -------------------------------------------------------------------------
  // Phase 1: Plan
  //
  // The planning agent reads the open issue list,
  // builds a dependency graph, and selects the issues that can be worked in
  // parallel right now (i.e., no blocking dependencies on other open issues).
  //
  // It outputs a <plan> JSON block — Output.object parses and validates it.
  // -------------------------------------------------------------------------
  const plan = await sandcastle.run({
    signal: stop.signal,
    hooks,
    sandbox: sandboxProvider(),
    branchStrategy: { type: "merge-to-head" },
    name: "planner",
    // One iteration is enough: the planner just needs to read and reason,
    // not write code. (Structured output requires maxIterations: 1.)
    maxIterations: 1,
    agent: agents.planner,
    promptFile: "./.sandcastle/plan-prompt.md",
    // Extract and validate the <plan> JSON into a typed object. Throws
    // StructuredOutputError if the tag is missing, the JSON is malformed, or
    // validation fails — which aborts the loop.
    output: sandcastle.Output.object({ tag: "plan", schema: planSchema }),
  });

  const issues = plan.output.issues.slice(0, parallelLimit);
  stop.signal.throwIfAborted();

  if (issues.length === 0) {
    // No unblocked work — either everything is done or everything is blocked.
    console.log("No unblocked issues to work on.");
    return "empty";
  }

  console.log(
    `Planning complete. ${issues.length} issue(s) to work in parallel:`,
  );
  for (const issue of issues) {
    console.log(`  ${issue.id}: ${issue.title} → ${issue.branch}`);
  }

  // -------------------------------------------------------------------------
  // Phase 2: Validate + Implement + Review
  //
  // For each issue, create a sandbox via createSandbox() so the implementer
  // and reviewer share the same sandbox instance per branch. Validation must
  // approve the issue first; human handoffs exclude the whole branch from merging.
  //
  // Promise.allSettled means one failing pipeline doesn't cancel the others.
  // -------------------------------------------------------------------------

  const settled = await Promise.allSettled(
    issues.map(async (issue: PlannedIssue) => {
      stop.signal.throwIfAborted();
      const sandbox = await sandcastle.createSandbox({
        branch: issue.branch,
        sandbox: sandboxProvider(),
        hooks,
      });

      try {
        return await runIssuePipeline(sandbox, issue, TARGET_BRANCH, undefined, stop.signal);
      } finally {
        await sandbox.close();
      }
    }),
  );
  stop.signal.throwIfAborted();

  // Log any agents that threw (network error, sandbox crash, etc.).
  for (const [i, outcome] of settled.entries()) {
    if (outcome.status === "rejected") {
      console.error(
        `  ✗ ${issues[i]!.id} (${issues[i]!.branch}) failed: ${outcome.reason}`,
      );
    }
  }

  // Only pass branches that actually produced commits to the merge phase.
  // An agent that ran successfully but made no commits has nothing to merge.
  const completedIssues = settled
    .map((outcome, i) => ({ outcome, issue: issues[i]! }))
    .filter(
      (entry) =>
        entry.outcome.status === "fulfilled" &&
        entry.outcome.value.status === "completed" &&
        entry.outcome.value.commits.length > 0,
    )
    .map((entry) => entry.issue);

  const completedBranches = completedIssues.map((i) => i.branch);

  console.log(
    `\nExecution complete. ${completedBranches.length} branch(es) with commits:`,
  );
  for (const branch of completedBranches) {
    console.log(`  ${branch}`);
  }

  if (completedBranches.length === 0) {
    // All agents ran but none made commits — nothing to merge this cycle.
    console.log("No commits produced. Nothing to merge.");
    return "idle";
  }

  // -------------------------------------------------------------------------
  // Phase 3: Merge
  //
  // One agent merges all completed branches into the current branch,
  // resolving any conflicts and running tests to confirm everything works.
  //
  // The {{BRANCHES}} and {{ISSUES}} prompt arguments are lists that the agent
  // uses to know which branches to merge and which issues to close.
  // -------------------------------------------------------------------------
  checkBranch();
  await sandcastle.run({
    signal: stop.signal,
    hooks,
    sandbox: sandboxProvider(),
    branchStrategy: { type: "merge-to-head" },
    name: "merger",
    maxIterations: 1,
    agent: agents.merger,
    promptFile: "./.sandcastle/merge-prompt.md",
    promptArgs: {
      // A markdown list of branch names, one per line.
      BRANCHES: completedBranches.map((b) => `- ${b}`).join("\n"),
      // A markdown list of issue IDs and titles, one per line.
      ISSUES: completedIssues.map((i) => `- ${i.id}: ${i.title}`).join("\n"),
    },
  });

  console.log("\nBranches merged.");
  return "progress";
}

function checkBranch() {
  if (process.env.SANDCASTLE_EXPECTED_BRANCH) {
    const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
    assertExpectedBranch(process.env.SANDCASTLE_EXPECTED_BRANCH, branch);
  }
}

process.once("SIGINT", interrupt);
process.once("SIGTERM", terminate);
try {
  await runLoop(options, { runCycle, hasWork: hasReadyIssues, signal: stop.signal });
} finally {
  process.removeListener("SIGINT", interrupt);
  process.removeListener("SIGTERM", terminate);
}
console.log(stop.signal.aborted ? "\nStopped." : "\nAll done.");
