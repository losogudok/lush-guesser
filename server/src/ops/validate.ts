import { openForRead } from './database';

/**
 * Validates an input file is a parseable, uncorrupted SQLite database
 * before anything is restored from it. Opening read-only already proves
 * the file parses (a non-SQLite file fails the open with `file is not a
 * database`); `PRAGMA integrity_check` additionally catches truncated or
 * corrupted-but-headered files.
 */
export const assertValidSqliteFile = (path: string): void => {
  const database = openForRead(path);
  try {
    const results = database.pragma('integrity_check') as Array<{
      integrity_check?: string;
    }>;
    const [result] = results;
    // better-sqlite3 returns { integrity_check: 'ok' } for healthy files.
    if (!result || result.integrity_check !== 'ok') {
      throw new Error(
        `Integrity check failed for ${path}: ${JSON.stringify(result)}`,
      );
    }
  } finally {
    database.close();
  }
};

/** True when the file already holds a usable SQLite database. */
export const isSqliteFile = (path: string): boolean => {
  try {
    assertValidSqliteFile(path);
    return true;
  } catch {
    return false;
  }
};
