import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { setTimeout } from "node:timers/promises";
import { parseEnv } from "node:util";

export function loopOptions(env: NodeJS.ProcessEnv = process.env) {
  const value = (env.SANDCASTLE_MAX_ITERATIONS ?? "1").trim();
  const maxIterations = value === "infinite" ? Infinity : Number(value);
  if (value !== "infinite" && (!Number.isSafeInteger(maxIterations) || maxIterations < 1)) {
    throw new Error('SANDCASTLE_MAX_ITERATIONS must be a positive integer or "infinite"');
  }
  const seconds = Number(env.SANDCASTLE_POLL_INTERVAL_SECONDS ?? "60");
  if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 86_400) {
    throw new Error("SANDCASTLE_POLL_INTERVAL_SECONDS must be an integer between 1 and 86400");
  }
  return { maxIterations, pollIntervalMs: seconds * 1000 };
}

export function parallelIssueLimit(env: NodeJS.ProcessEnv = process.env): number {
  const limit = Number(env.SANDCASTLE_MAX_PARALLEL_ISSUES ?? "2");
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 32) {
    throw new Error("SANDCASTLE_MAX_PARALLEL_ISSUES must be an integer between 1 and 32");
  }
  return limit;
}

export function assertExpectedBranch(expected: string | undefined, actual: string): void {
  if (expected && expected !== actual) throw new Error(`Sandcastle expected branch ${expected}; found ${actual || "detached HEAD"}.`);
}

type QueueIssue = { assignees: unknown[]; labels: { name: string }[] };
export function hasEligibleIssue(issues: QueueIssue[]): boolean {
  const excluded = new Set(["needs-triage", "needs-info", "ready-for-human", "wontfix"]);
  return issues.some(issue => issue.assignees.length === 0 &&
    issue.labels.some(label => label.name === "ready-for-agent") &&
    issue.labels.every(label => !excluded.has(label.name)));
}

function githubEnvironment() {
  const envFile = new URL(".env", import.meta.url);
  const configured = existsSync(envFile) ? parseEnv(readFileSync(envFile, "utf8")) : {};
  const env = { ...process.env };
  for (const [key, value] of Object.entries(configured)) env[key] = value || env[key];
  return env;
}

export class QueueReadError extends Error {
  constructor(cause: unknown) {
    super(`GitHub issue read failed: ${cause instanceof Error ? cause.message : "unknown error"}`, { cause });
    this.name = "QueueReadError";
  }
}

// Read before creating a sandbox, so a failed request cannot leave partial work.
export function readPlanningIssues(): string {
  try {
    return execFileSync("gh", [
      "issue", "list", "--state", "open", "--label", "ready-for-agent", "--limit", "100",
      "--json", "number,title,body,labels,comments,assignees",
      "--jq", "[.[] | select(.assignees | length == 0) | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]",
    ], { env: githubEnvironment(), encoding: "utf8", timeout: 30_000, stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    throw new QueueReadError(error);
  }
}

// This inexpensive read avoids invoking the planner when the queue is empty.
// The planner and validator still check blockers and issue validity.
export function hasReadyIssues(): boolean {
  const stdout = execFileSync("gh", [
    "issue", "list", "--state", "open", "--label", "ready-for-agent", "--limit", "100",
    "--json", "assignees,labels",
  ], { env: githubEnvironment(), encoding: "utf8", timeout: 30_000 });
  return hasEligibleIssue(JSON.parse(stdout));
}

type CycleResult = "empty" | "idle" | "progress";
type LoopDependencies = {
  runCycle: (iteration: number) => Promise<CycleResult>;
  hasWork: () => boolean | Promise<boolean>;
  signal?: AbortSignal;
  wait?: (milliseconds: number, signal?: AbortSignal) => Promise<unknown>;
  log?: (message: string) => void;
};

export async function runLoop(options: ReturnType<typeof loopOptions>, dependencies: LoopDependencies) {
  const { runCycle, hasWork, signal } = dependencies;
  const log = dependencies.log ?? console.log;
  const wait = dependencies.wait ?? ((ms, abort) => setTimeout(ms, undefined, { signal: abort }));
  const continuous = options.maxIterations === Infinity;
  const poll = async (message: string) => {
    log(`${message} Checking again in ${options.pollIntervalMs / 1000}s.`);
    await wait(options.pollIntervalMs, signal);
  };
  try {
    for (let iteration = 1; iteration <= options.maxIterations && !signal?.aborted;) {
      if (continuous) {
        let ready;
        try { ready = await hasWork(); }
        catch (error) {
          if (signal?.aborted) break;
          log(`GitHub queue check failed: ${error instanceof Error ? error.message : "unknown error"}`);
          await poll("Queue unavailable.");
          continue;
        }
        if (!ready) {
          await poll("No eligible issues.");
          continue;
        }
      }
      signal?.throwIfAborted();
      let result: CycleResult;
      try { result = await runCycle(iteration++); }
      catch (error) {
        if (signal?.aborted) break;
        // Only the issue read before sandbox creation can safely retry a cycle.
        // Agent and merge failures still stop for inspection of partial work.
        if (!continuous || !(error instanceof QueueReadError)) throw error;
        log(error.message);
        await poll("Planner issue list unavailable.");
        continue;
      }
      if (!continuous && result === "empty") break;
      if (continuous && result !== "progress" && !signal?.aborted) {
        await poll("No branches merged.");
      }
    }
  } catch (error) {
    if (!signal?.aborted) throw error;
  }
}
