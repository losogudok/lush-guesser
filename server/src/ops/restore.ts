import { promises as fs } from 'node:fs';
import path from 'node:path';
import { openForRead } from './database';
import { isSqliteFile, assertValidSqliteFile } from './validate';
import { OperationFailed } from './errors';

/** Plan for one restore run: where the snapshot lands and how it gets there. */
export interface RestorePlan {
  target: string;
  staging: string;
  /** True when an existing target will be replaced (the `--force` case). */
  replaced: boolean;
}

/**
 * Builds a staging path beside the target, unique per process and second:
 * a failed restore leaves at most an orphan `.tmp` beside the target, never
 * a half-written database, and concurrent restores never collide.
 */
export const stagingPathFor = (target: string): string =>
  `${target}.restore-${process.pid}-${Date.now()}.tmp`;

/**
 * Checks the restore target is usable before anything is moved. The target
 * directory must exist (restores never create volume paths on their own),
 * and an existing target file is only replaceable with an explicit
 * `--force`, so a routine rerun can never silently wipe a live database.
 */
export const planRestoreTarget = async (
  target: string,
  staging: string,
  { force }: { force: boolean },
): Promise<RestorePlan> => {
  const parent = path.dirname(target);
  let parentStats;
  try {
    parentStats = await fs.stat(parent);
  } catch {
    throw new Error(
      `Target directory ${parent} does not exist; create it (or mount the volume) first.`,
    );
  }
  if (!parentStats.isDirectory()) {
    throw new Error(`Target directory ${parent} is not a directory.`);
  }

  const targetStats = await fs
    .stat(target)
    .catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return null;
      throw error;
    });

  if (targetStats && !force) {
    throw new Error(
      `Target ${target} already exists; pass --force to replace it (stop the backend first).`,
    );
  }

  return { target, staging, replaced: Boolean(targetStats) };
};

/**
 * Copies the snapshot to the staging file beside the target, flushes it to
 * disk, and renames it into place. The rename is atomic, so the target is
 * always a complete database; a failure at any earlier step removes the
 * staging file and leaves the previous target bytes untouched.
 */
export const restoreIntoTarget = async (
  snapshot: string,
  plan: RestorePlan,
  log?: (message: string) => void,
): Promise<void> => {
  try {
    log?.(`Copying snapshot to staging file ${plan.staging}…`);
    await fs.copyFile(snapshot, plan.staging);
    log?.('Staging copy written; flushing to disk…');

    // Make the staged bytes survive the rename: flush the file, then the
    // directory entry, before anything replaces the live database file.
    const stagingHandle = await fs.open(plan.staging, 'r+');
    try {
      await stagingHandle.sync();
      await stagingHandle.close();
    } catch (error) {
      await stagingHandle.close().catch(() => undefined);
      throw error;
    }

    log?.(`Renaming staging file into place at ${plan.target}…`);
    await fs.rename(plan.staging, plan.target);
  } catch (error) {
    await fs.rm(plan.staging, { force: true }).catch(() => undefined);
    throw error;
  }
};

/**
 * Proves the restored file is a readable SQLite database holding the
 * Leaderboard Entries: `PRAGMA integrity_check` for structural health and
 * a `SELECT COUNT(*)` against the real table the app reads. Failing here
 * means the rename already happened, but the previous data is still in
 * the snapshot; docs instruct re-running the restore.
 */
export const assertRestoredDatabaseReadable = (target: string): void => {
  assertValidSqliteFile(target);
  const database = openForRead(target);
  try {
    database.prepare('SELECT COUNT(*) FROM "leaderboard"').get();
  } finally {
    database.close();
  }
};

const USAGE = `Usage: node dist/ops/restore.js <snapshot-file> --to <target-db> [--force]

Restores a Leaderboard Entry snapshot into an explicit target database.
The target must be named with --to; nothing is restored "in place" by
accident. An existing target file is never overwritten without --force.

  <snapshot-file>   Snapshot produced by dist/ops/backup.js; validated with
                    PRAGMA integrity_check before anything is touched.
  --to <target-db>  Database file to restore into, e.g. /app/data/database.sqlite.
  --force           Confirm overwriting an existing target database.

The copy is written beside the target and atomically renamed into place,
so a failed restore leaves the previous database file untouched.

Environment:
  DATABASE_PATH  Suggested target when --to is omitted; restores should
                 still stay explicit and pass --to.

Stop the backend (docker compose stop backend) before restoring into the
live database file; SQLite requires no other writer attached during the
atomic swap.`;

interface RestoreArguments {
  snapshot: string;
  target: string;
  force: boolean;
}

const parseArguments = (argv: string[]): RestoreArguments | null => {
  const positional: string[] = [];
  let target: string | null = null;
  let force = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--force') {
      force = true;
    } else if (argument === '--to') {
      target = argv[index + 1] ?? null;
      index += 1;
    } else if (argument.startsWith('--to=')) {
      target = argument.slice('--to='.length) || null;
    } else if (!argument.startsWith('--')) {
      positional.push(argument);
    } else {
      return null;
    }
  }

  if (positional.length !== 1 || !target) return null;
  return { snapshot: positional[0], target, force };
};

/**
 * CLI entry point: `node dist/ops/restore.js <snapshot> --to <target> [--force]`.
 * Every failure exits non-zero with a clear stderr message, and neither the
 * snapshot nor the target is mutated when validation or staging fails.
 */
export const main = async (): Promise<void> => {
  try {
    const args = parseArguments(process.argv.slice(2));
    if (!args) {
      console.log(USAGE);
      process.exitCode = 1;
      return;
    }

    if (!isSqliteFile(args.snapshot)) {
      throw new Error(
        `${args.snapshot} is not a readable, uncorrupted SQLite database.`,
      );
    }

    if (path.resolve(args.snapshot) === path.resolve(args.target)) {
      throw new Error('The snapshot and the target are the same file.');
    }

    const plan: RestorePlan = await planRestoreTarget(
      args.target,
      stagingPathFor(args.target),
      { force: args.force },
    );

    await restoreIntoTarget(args.snapshot, plan, (message: string) =>
      console.log(`[restore] ${message}`),
    );
    assertRestoredDatabaseReadable(args.target);
    console.log(
      `[restore] Done.${plan.replaced ? ' Replaced the previous database.' : ''}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Copies go to a staging file first, so a failure here leaves the
    // previous target database and the snapshot untouched.
    throw new OperationFailed(
      'restore',
      `Restore aborted, target untouched. ${message}`,
    );
  }
};

if (require.main === module) {
  void main().catch((error: unknown) => {
    const report =
      error instanceof OperationFailed
        ? `${error.prefix} ${error.message}`
        : `[restore] Unexpected failure: ${String(error)}`;
    console.error(report);
    process.exitCode = 1;
  });
}
