import Database from 'better-sqlite3';

/**
 * Opens an existing SQLite file for reading only. The open itself proves the
 * file parses as SQLite, and busy handling keeps the wait explicit instead of
 * throwing on the first concurrent reader.
 */
export const openForRead = (path: string): Database.Database =>
  new Database(path, {
    readonly: true,
    fileMustExist: true,
    timeout: 5000,
  });

/**
 * Opens a SQLite file for reading and writing without creating one. For
 * restore targets and validation probes that must never conjure an
 * empty database as a side effect.
 */
export const openForWrite = (path: string): Database.Database =>
  new Database(path, {
    fileMustExist: true,
    timeout: 5000,
  });

/** True when the error reports the well-known `database is busy` state. */
export const isBusyError = (error: unknown): boolean =>
  error instanceof Error && 'code' in error && error.code === 'SQLITE_BUSY';
