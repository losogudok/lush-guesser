import { lstatSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

export function logRetentionOptions(env: NodeJS.ProcessEnv = process.env) {
  const maxFiles = Number(env.SANDCASTLE_LOG_MAX_FILES ?? "50");
  const days = Number(env.SANDCASTLE_LOG_RETENTION_DAYS ?? "7");
  for (const [name, value] of [["SANDCASTLE_LOG_MAX_FILES", maxFiles], ["SANDCASTLE_LOG_RETENTION_DAYS", days]] as const) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  }
  return { maxFiles, maxAgeMs: days * 86_400_000 };
}

// Call only between batches, after all agents have finished writing their logs.
// Never recurse or follow symlinks: this directory can also contain other files.
export function cleanupLogs(directory: string, options = logRetentionOptions(), now = Date.now()) {
  let metadata;
  try { metadata = lstatSync(directory); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { removed: 0, bytesFreed: 0, remaining: 0 };
    throw error;
  }
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) throw new Error("Log directory must be a real directory");
  const logs = readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith(".log"))
    .map(entry => ({ name: entry.name, metadata: lstatSync(join(directory, entry.name)) }))
    .filter(entry => entry.metadata.isFile())
    .sort((a, b) => b.metadata.mtimeMs - a.metadata.mtimeMs || a.name.localeCompare(b.name));
  let removed = 0;
  let bytesFreed = 0;
  for (const [index, log] of logs.entries()) {
    if (index < options.maxFiles && now - log.metadata.mtimeMs < options.maxAgeMs) continue;
    unlinkSync(join(directory, log.name));
    removed++;
    bytesFreed += log.metadata.size;
  }
  return { removed, bytesFreed, remaining: logs.length - removed };
}
