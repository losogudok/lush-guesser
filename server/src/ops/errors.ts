import { isBusyError } from './database';

/**
 * Third-resolution timestamp used in snapshot filenames, formatted as
 * `YYYYMMDD-HHMMSS` so names sort chronologically in every locale.
 */
export const formatTimestamp = (date: Date): string => {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const dayPart = [
    String(date.getFullYear()).padStart(4, '0'),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('');
  const timePart = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('');
  return `${dayPart}-${timePart}`;
};

/**
 * Marks a failed operation as fatal to the process: the error is reported
 * on stderr in `[context] message` form and the caller exits non-zero.
 * Source data is never mutated before a failure here, so a rejected
 * promise leaves the database exactly as it was.
 */
export class OperationFailed extends Error {
  readonly context: string;

  constructor(context: string, message: string, cause?: unknown) {
    const text =
      cause instanceof Error ? `${message}: ${cause.message}` : message;
    super(text);
    this.name = 'OperationFailed';
    this.context = context;
  }

  /** Standard output line prefix, e.g. `[backup]`. */
  get prefix(): string {
    return `[${this.context}]`;
  }
}

/**
 * Runs `action`, translating busy SQLite states into a retry under a
 * bounded exponential backoff up to `maxAttempts`. Retries only make sense
 * around steps where concurrency is expected, like taking a backup from a
 * live database.
 */
export const retryOnBusy = async <T>(
  action: () => Promise<T>,
  options: {
    maxAttempts: number;
    backoffMilliseconds: number;
    log?: (message: string) => void;
  },
): Promise<T> => {
  let attempt = 1;
  for (;;) {
    try {
      return await action();
    } catch (error) {
      if (attempt >= options.maxAttempts || !isBusyError(error)) {
        throw error;
      }
      const delay = options.backoffMilliseconds * 2 ** (attempt - 1);
      options.log?.(
        `Database is busy; retrying in ${delay} ms (attempt ${attempt + 1} of ${options.maxAttempts}).`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }
};
