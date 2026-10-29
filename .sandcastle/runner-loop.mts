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
type CandidateIssue = QueueIssue & { number: number; body: string };

// Only explicit dependency declarations are interpreted here. The planner still
// reasons about dependencies implied by requirements and overlapping changes.
export function blockingReferences(body: string, repository: string): { repository: string; number: number }[] {
  const references = new Map<string, { repository: string; number: number }>();
  let sectionLevel: number | undefined;
  let fenced = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    const declaration = /^(?:#{1,6}\s+)?blocked by\b\s*:?\s*(.*)$/i.exec(line.trim());
    if (declaration) sectionLevel = heading?.[1]?.length ?? 0;
    else if (heading && sectionLevel !== undefined && heading[1]!.length <= sectionLevel) sectionLevel = undefined;
    if (sectionLevel === undefined || heading && !declaration) continue;
    const text = declaration?.[1] ?? line;
    // A plain "Blocked by:" declaration may be followed by a bullet list.
    if (!declaration && sectionLevel === 0 && text.trim() && !/^\s*(?:[-*+]\s+|\d+\.\s+|#\d|https:\/\/github\.com\/)/.test(text)) {
      sectionLevel = undefined;
      continue;
    }
    for (const match of text.matchAll(/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/([1-9]\d*)|(?:([\w.-]+\/[\w.-]+))?#([1-9]\d*)/g)) {
      const reference = { repository: match[1] ?? match[3] ?? repository, number: Number(match[2] ?? match[4]) };
      references.set(`${reference.repository.toLowerCase()}#${reference.number}`, reference);
    }
  }
  return [...references.values()];
}

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

function github(args: string[]): string {
  return execFileSync("gh", args, {
    env: githubEnvironment(), encoding: "utf8", timeout: 30_000, stdio: ["ignore", "pipe", "pipe"],
  });
}

// Read before creating a sandbox, so a failed request cannot leave partial work.
export function readPlanningIssues(): string {
  try {
    const issues = JSON.parse(github([
      "issue", "list", "--state", "open", "--label", "ready-for-agent", "--limit", "100",
      "--json", "number,title,body,labels,comments,assignees",
    ])) as (CandidateIssue & { title: string; comments: { body: string }[] })[];
    return JSON.stringify(issues.filter(issue => hasEligibleIssue([issue])).map(issue => ({
      number: issue.number, title: issue.title, body: issue.body,
      labels: issue.labels.map(label => label.name), comments: issue.comments.map(comment => comment.body),
    })));
  } catch (error) {
    throw new QueueReadError(error);
  }
}

// No model or sandbox is needed to check labels, assignees, or declared blockers.
// Cache blocker states only for this poll, so closures are seen on the next one.
export function hasReadyIssues(): boolean {
  try {
    const issues = (JSON.parse(github([
      "issue", "list", "--state", "open", "--label", "ready-for-agent", "--limit", "100",
      "--json", "number,body,assignees,labels",
    ])) as CandidateIssue[]).filter(issue => hasEligibleIssue([issue]));
    if (issues.length === 0) return false;
    const repository = github(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).trim();
    // Candidates came from an open-issue query; do not fetch them again when
    // another candidate names them as a blocker.
    const states = new Map(issues.map(issue => [`${repository.toLowerCase()}#${issue.number}`, "OPEN"]));
    return issues.some(issue => {
      for (const reference of blockingReferences(issue.body, repository)) {
        const key = `${reference.repository.toLowerCase()}#${reference.number}`;
        if (!states.has(key)) {
          const state = github(["issue", "view", String(reference.number), "--repo", reference.repository,
            "--json", "state", "--jq", ".state"]).trim();
          if (state !== "OPEN" && state !== "CLOSED") throw new Error(`Invalid state for blocker ${key}`);
          states.set(key, state);
        }
        if (states.get(key) !== "CLOSED") return false;
      }
      const pages = JSON.parse(github(["api", "--paginate", "--slurp",
        `repos/${repository}/issues/${issue.number}/dependencies/blocked_by?per_page=100`,
      ])) as { state: string }[][];
      return pages.flat().every(blocker => {
        if (blocker.state !== "open" && blocker.state !== "closed") throw new Error("Invalid native blocker state");
        return blocker.state === "closed";
      });
    });
  } catch (error) {
    throw new QueueReadError(error);
  }
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
      let ready;
      try { ready = await hasWork(); }
      catch (error) {
        if (signal?.aborted) break;
        if (!continuous) throw error;
        log(`GitHub queue check failed: ${error instanceof Error ? error.message : "unknown error"}`);
        await poll("Queue unavailable.");
        continue;
      }
      if (!ready) {
        if (!continuous) { log("No eligible issues."); break; }
        await poll("No eligible issues.");
        continue;
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
