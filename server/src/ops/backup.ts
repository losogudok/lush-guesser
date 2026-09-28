import { promises as fs } from 'node:fs';
import path from 'node:path';
import { resolveDatabasePath } from '../database';
import { openForRead } from './database';
import { formatTimestamp, retryOnBusy, OperationFailed } from './errors';

/** Retries when the live database is momentarily locked by the app. */
const BACKUP_MAX_ATTEMPTS = 5;
const BACKUP_BACKOFF_MILLISECONDS = 100;

/** Resolves to a free destination path: `file` itself, or a timestamped file in `dir`. */
export interface BackupPlan {
  destination: string;
  kind: 'file' | 'directory';
}

/**
 * Decides where the snapshot goes. An explicit file must not already exist,
 * so a rerun never clobbers a prior snapshot; a directory receives a
 * `leaderboard-<timestamp>.sqlite` name that repeats only once per second,
 * which the `.exists` check below catches as well.
 */
export const planBackupDestination = async (
  output: string,
  now: () => Date = () => new Date(),
): Promise<BackupPlan> => {
  const stats = await fs.stat(output).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });

  if (stats?.isDirectory()) {
    const filename = `leaderboard-${formatTimestamp(now())}.sqlite`;
    return {
      destination: path.join(output, filename),
      kind: 'directory',
    };
  }

  if (stats) {
    throw new Error(
      `Backup destination ${output} already exists; move it aside or pick another name.`,
    );
  }

  if (output.endsWith(path.sep) || output.endsWith('/')) {
    throw new Error(`Backup directory ${output} does not exist.`);
  }
  return { destination: output, kind: 'file' };
};

/**
 * Produces a consistent copy of a live SQLite database with the Online
 * Backup API (`better-sqlite3`'s `db.backup`). The app can keep serving
 * traffic mid-backup: readers see a consistent snapshot, in-flight writes
 * are simply not in it. The source is opened read-only, so it cannot be
 * mutated even on failure.
 */
export const backupDatabase = async (
  source: string,
  destination: string,
): Promise<void> => {
  if (path.resolve(destination) === path.resolve(source)) {
    throw new Error(
      'The backup destination would overwrite the live database; choose a different path.',
    );
  }

  const sourceDatabase = openForRead(source);
  try {
    await retryOnBusy(() => sourceDatabase.backup(destination), {
      maxAttempts: BACKUP_MAX_ATTEMPTS,
      backoffMilliseconds: BACKUP_BACKOFF_MILLISECONDS,
    });
  } finally {
    sourceDatabase.close();
  }
};

/**
 * Ensures the snapshot is reachable as a normal file of the deployment
 * volume or host path the operator chose. Failure leaves a partial backup
 * file behind, which the docs call out; the next run picks a fresh name.
 */
export const runBackup = async (
  source: string,
  output: string,
  now: () => Date = () => new Date(),
): Promise<string> => {
  const { destination } = await planBackupDestination(output, now);
  await backupDatabase(source, destination);
  return destination;
};

const USAGE = `Usage: node dist/ops/backup.js <output-file-or-directory>

Creates a consistent snapshot of the Leaderboard Entry database with the
SQLite Online Backup API, safe to run while the backend is live.

  <output-file-or-directory>
      Destination for the snapshot. When an existing directory is given,
      the snapshot is named leaderboard-<YYYYMMDD-HHMMSS>.sqlite inside it.
      A non-existent path is treated as a new file and must be free.

Environment:
  DATABASE_PATH  Database location; defaults to ./database.sqlite
                 (the production container sets /app/data/database.sqlite).`;

/**
 * CLI entry point: `node dist/ops/backup.js <output>`. Prints the snapshot
 * path on success and exits non-zero with a clear stderr message when the
 * database is missing, the destination is taken, or the snapshot fails.
 */
export const main = async (): Promise<void> => {
  const [output] = process.argv.slice(2);
  if (!output || output === '--help' || output === '-h') {
    console.log(USAGE);
    if (!output) process.exitCode = 1;
    return;
  }

  try {
    const source = resolveDatabasePath();
    const destination = await runBackup(source, output);
    console.log(`[backup] Snapshot written to ${destination}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // A failed backup never mutates the source: it is opened read-only and
    // the Online Backup API writes only to the destination file.
    throw new OperationFailed(
      'backup',
      `Backup aborted, source data untouched. ${message}`,
    );
  }
};

if (require.main === module) {
  void main().catch((error: unknown) => {
    const report =
      error instanceof OperationFailed
        ? `${error.prefix} ${error.message}`
        : `[backup] Unexpected failure: ${String(error)}`;
    console.error(report);
    process.exitCode = 1;
  });
}
