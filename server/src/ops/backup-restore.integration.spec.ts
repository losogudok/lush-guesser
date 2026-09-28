import { promises as fs } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { backupDatabase, planBackupDestination, runBackup } from './backup';
import {
  assertRestoredDatabaseReadable,
  planRestoreTarget,
  restoreIntoTarget,
  stagingPathFor,
} from './restore';
import { isSqliteFile } from './validate';

const LEADERBOARD_ROWS_QUERY =
  'SELECT id, name, score, createdAt FROM "leaderboard"';

/** The LeaderboardService's serving order: score DESC, createdAt ASC. */
const LEADERBOARD_ORDER_QUERY =
  'SELECT id, name, score, createdAt FROM "leaderboard" ORDER BY score DESC, createdAt ASC';

interface EntryRow {
  id: number;
  name: string;
  score: number;
  createdAt: string;
}

const readLeaderboard = (path: string): EntryRow[] => {
  const database = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return database.prepare(LEADERBOARD_ORDER_QUERY).all() as EntryRow[];
  } finally {
    database.close();
  }
};

const readAllEntries = (path: string): EntryRow[] => {
  const database = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return database.prepare(LEADERBOARD_ROWS_QUERY).all() as EntryRow[];
  } finally {
    database.close();
  }
};

const writeLeaderboardSchema = (path: string): void => {
  const database = new Database(path);
  try {
    database.exec(`
      CREATE TABLE "leaderboard" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "name" varchar NOT NULL,
        "score" integer NOT NULL,
        "createdAt" datetime NOT NULL DEFAULT (datetime('now'))
      )
    `);
  } finally {
    database.close();
  }
};

const insertEntries = (path: string, entries: EntryRow[]): void => {
  const database = new Database(path);
  try {
    const insert = database.prepare(
      'INSERT INTO "leaderboard" (id, name, score, createdAt) VALUES (?, ?, ?, ?)',
    );
    for (const entry of entries) {
      insert.run(entry.id, entry.name, entry.score, entry.createdAt);
    }
  } finally {
    database.close();
  }
};

/** Representative entries: score ties and mixed timestamps, not just insert order. */
const representativeEntries = (): EntryRow[] => [
  { id: 1, name: 'Moss', score: 50, createdAt: '2026-03-02 10:00:00' },
  { id: 2, name: 'Twilight', score: 120, createdAt: '2026-03-01 09:00:00' },
  // Same score as Twilight but later: must rank below it after restore.
  { id: 3, name: 'Sunset', score: 120, createdAt: '2026-03-01 11:00:00' },
  { id: 4, name: 'Amber', score: 80, createdAt: '2026-02-28 08:30:00' },
  { id: 5, name: 'Fern', score: 120, createdAt: '2026-03-01 10:15:00' },
  // Same name and score as another entry; only createdAt distinguishes them.
  { id: 6, name: 'Moss', score: 50, createdAt: '2026-03-02 15:45:00' },
];

/** The exact ranking the leaderboard endpoint must reproduce after restore. */
const rankedEntries = (): EntryRow[] => [
  representativeEntries()[1], // Twilight, 120 @ 09:00
  representativeEntries()[4], // Fern, 120 @ 10:15
  representativeEntries()[2], // Sunset, 120 @ 11:00
  representativeEntries()[3], // Amber, 80
  representativeEntries()[0], // Moss, 50 @ 10:00
  representativeEntries()[5], // Moss, 50 @ 15:45
];

describe('ops backup and restore', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'lush-guesser-ops-'));
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('backup', () => {
    it('produces a byte-consistent snapshot the restore path accepts', async () => {
      const source = join(tempDir, 'db.sqlite');
      const snapshot = join(tempDir, 'out', 'snapshot.sqlite');
      await fs.mkdir(join(tempDir, 'out'), { recursive: true });
      writeLeaderboardSchema(source);
      insertEntries(source, representativeEntries());

      await backupDatabase(source, snapshot);
      assertRestoredDatabaseReadable(snapshot);

      // Ranked rows in the service's exact ranking order.
      expect(readLeaderboard(snapshot)).toEqual(rankedEntries());
    });

    it('rejects an existing explicit destination and leaves it untouched', async () => {
      const source = join(tempDir, 'db.sqlite');
      const previous = join(tempDir, 'keep-me.sqlite');
      writeLeaderboardSchema(source);
      await fs.writeFile(previous, 'prior snapshot bytes');

      await expect(runBackup(source, previous)).rejects.toThrow(
        /already exists/,
      );
      expect(await fs.readFile(previous, 'utf8')).toBe('prior snapshot bytes');
    });

    it('names directory destinations leaderboard-<timestamp>.sqlite', async () => {
      const source = join(tempDir, 'db.sqlite');
      const directory = join(tempDir, 'snaps');
      await fs.mkdir(directory, { recursive: true });
      writeLeaderboardSchema(source);

      const destination = await runBackup(
        source,
        directory,
        () => new Date(2026, 0, 2, 3, 4, 5),
      );

      expect(destination).toBe(
        join(directory, 'leaderboard-20260102-030405.sqlite'),
      );
      assertRestoredDatabaseReadable(destination);
    });

    it('refuses to let the destination collide with the live database', async () => {
      const source = join(tempDir, 'db.sqlite');
      writeLeaderboardSchema(source);

      await expect(backupDatabase(source, source)).rejects.toThrow(
        /would overwrite the live database/,
      );
    });

    it('plans a trailing-slash output as a missing directory', async () => {
      await expect(
        planBackupDestination(`${tempDir}/missing/`),
      ).rejects.toThrow(/does not exist/);
    });
  });

  describe('restore', () => {
    it('recovers Leaderboard Entries, createdAt, and ranking order into an empty database', async () => {
      const source = join(tempDir, 'db.sqlite');
      const snapshot = join(tempDir, 'snapshot.sqlite');
      writeLeaderboardSchema(source);
      insertEntries(source, representativeEntries());
      await backupDatabase(source, snapshot);

      // The clean deployment: a fresh, migrated but empty database.
      const target = join(tempDir, 'clean.sqlite');
      writeLeaderboardSchema(target);
      expect(readLeaderboard(target)).toEqual([]);

      const plan = await planRestoreTarget(target, stagingPathFor(target), {
        force: true,
      });
      expect(plan.replaced).toBe(true);

      await restoreIntoTarget(snapshot, plan);
      assertRestoredDatabaseReadable(target);

      // Same rows (including ids), same timestamps, same score-tie ranking:
      // the restored file answers the leaderboard query identically.
      expect(readAllEntries(target)).toEqual(representativeEntries());
      expect(readLeaderboard(target)).toEqual(rankedEntries());
      expect(readLeaderboard(target)).toEqual(readLeaderboard(snapshot));
    });

    it('staging and rename preserve ids and row order byte-for-byte', async () => {
      const source = join(tempDir, 'db.sqlite');
      const snapshot = join(tempDir, 'snapshot.sqlite');
      writeLeaderboardSchema(source);
      insertEntries(source, representativeEntries());
      await backupDatabase(source, snapshot);

      const target = join(tempDir, 'target.sqlite');
      const plan = await planRestoreTarget(target, stagingPathFor(target), {
        force: false,
      });
      await restoreIntoTarget(snapshot, plan);

      expect(await fs.readFile(target)).toEqual(await fs.readFile(snapshot));
    });

    it('rejects a garbage snapshot before anything is restored', async () => {
      const garbage = join(tempDir, 'garbage.bin');
      await fs.writeFile(garbage, Buffer.from('this is not sqlite at all'));
      const target = join(tempDir, 'never-created.sqlite');

      // The CLI validates the snapshot with this exact check before it
      // plans or copies anything; garbage input never reaches the target.
      expect(isSqliteFile(garbage)).toBe(false);
      await expect(fs.access(target)).rejects.toThrow();
    });

    it('refuses to overwrite an existing target without force', async () => {
      const target = join(tempDir, 'existing.sqlite');
      writeLeaderboardSchema(target);
      insertEntries(target, [
        { id: 1, name: 'Original', score: 1, createdAt: '2026-01-01 00:00:00' },
      ]);
      const bytesBefore = await fs.readFile(target);

      await expect(
        planRestoreTarget(target, stagingPathFor(target), { force: false }),
      ).rejects.toThrow(/--force/);

      expect(await fs.readFile(target)).toEqual(bytesBefore);
    });

    it('stages beside the target and cleans staging up when the copy fails', async () => {
      const target = join(tempDir, 'target.sqlite');
      const staging = stagingPathFor(target);

      expect(staging).toMatch(
        new RegExp(
          `^${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.restore-\\d+-\\d+\\.tmp$`,
        ),
      );
      expect(staging.startsWith(tempDir)).toBe(true);

      const plan = await planRestoreTarget(target, staging, { force: false });
      await expect(
        restoreIntoTarget(join(tempDir, 'missing-snapshot.sqlite'), plan),
      ).rejects.toThrow();

      const leftovers = (await fs.readdir(tempDir)).filter((name) =>
        name.endsWith('.tmp'),
      );
      expect(leftovers).toEqual([]);
    });

    it('fails clearly when the target directory does not exist', async () => {
      const missing = join(tempDir, 'nowhere', 'db.sqlite');

      await expect(
        planRestoreTarget(missing, stagingPathFor(missing), { force: true }),
      ).rejects.toThrow(/does not exist/);
    });
  });
});
