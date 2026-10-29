import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanupLogs, logRetentionOptions } from "./log-retention.mts";

test("retention removes expired logs and keeps only the newest files within the limit", () => {
  const directory = mkdtempSync(join(tmpdir(), "sandcastle-logs-"));
  const now = Date.now();
  try {
    for (const [name, age] of [["expired.log", 8 * 86_400_000], ["old.log", 3000], ["recent.log", 2000], ["latest.log", 1000]] as const) {
      const file = join(directory, name);
      writeFileSync(file, "log");
      utimesSync(file, new Date(now - age), new Date(now - age));
    }
    assert.deepEqual(cleanupLogs(directory, { maxFiles: 2, maxAgeMs: 7 * 86_400_000 }, now), {
      removed: 2, bytesFreed: 6, remaining: 2,
    });
    assert.deepEqual(readdirSync(directory).sort(), ["latest.log", "recent.log"]);
    assert.equal(cleanupLogs(directory, { maxFiles: 2, maxAgeMs: 7 * 86_400_000 }, now).removed, 0);
    assert.equal(cleanupLogs(directory, { maxFiles: 2, maxAgeMs: 7 * 86_400_000 }, now + 8 * 86_400_000).remaining, 0);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("cleanup ignores unrelated files, nested directories and symlinks", () => {
  const directory = mkdtempSync(join(tmpdir(), "sandcastle-logs-safety-"));
  try {
    const logs = join(directory, "logs");
    mkdirSync(logs);
    writeFileSync(join(logs, "notes.txt"), "keep");
    mkdirSync(join(logs, "nested.log"));
    writeFileSync(join(logs, "nested.log", "old.log"), "keep");
    const outside = join(directory, "outside.log");
    writeFileSync(outside, "keep");
    symlinkSync(outside, join(logs, "linked.log"));
    const options = { maxFiles: 1, maxAgeMs: 1 };
    assert.equal(cleanupLogs(logs, options, Date.now() + 1000).removed, 0);
    assert.equal(existsSync(outside), true);
    assert.equal(existsSync(join(logs, "nested.log", "old.log")), true);
    symlinkSync(logs, join(directory, "linked-directory"));
    assert.throws(() => cleanupLogs(join(directory, "linked-directory"), options), /real directory/);
    assert.equal(cleanupLogs(join(directory, "missing"), options).removed, 0);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("retention defaults and invalid configuration are explicit", () => {
  assert.deepEqual(logRetentionOptions({}), { maxFiles: 50, maxAgeMs: 7 * 86_400_000 });
  assert.deepEqual(logRetentionOptions({ SANDCASTLE_LOG_MAX_FILES: "10", SANDCASTLE_LOG_RETENTION_DAYS: "1" }), {
    maxFiles: 10, maxAgeMs: 86_400_000,
  });
  for (const key of ["SANDCASTLE_LOG_MAX_FILES", "SANDCASTLE_LOG_RETENTION_DAYS"]) {
    for (const value of ["0", "-1", "1.5", "bad", "Infinity"]) assert.throws(() => logRetentionOptions({ [key]: value }), /positive integer/);
  }
});
