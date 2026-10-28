import { BadRequestException } from '@nestjs/common';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { LeaderboardEntry } from './leaderboard.entity';
import { LeaderboardService } from './leaderboard.service';

describe('LeaderboardService', () => {
  let dataSource: DataSource;
  let service: LeaderboardService;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'lush-guesser-leaderboard-'));
    dataSource = new DataSource({
      type: 'better-sqlite3',
      database: join(tempDir, 'leaderboard.sqlite'),
      entities: [LeaderboardEntry],
      synchronize: true,
    });
    await dataSource.initialize();
    service = new LeaderboardService(
      dataSource.getRepository(LeaderboardEntry),
    );
  });

  afterEach(async () => {
    await dataSource.destroy();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates exactly one normalized Leaderboard Entry and exposes it through ranking', async () => {
    const saved = await service.addScore('  Ada Lovelace  ', 1000);

    expect(saved).toMatchObject({ name: 'Ada Lovelace', score: 1000 });
    const ranked = await service.getTopScores();
    expect(ranked).toHaveLength(1);
    expect(ranked[0]).toMatchObject({
      id: saved.id,
      name: 'Ada Lovelace',
      score: 1000,
    });
  });

  it('accepts a normalized twenty-character display name and a zero score', async () => {
    const displayName = 'A'.repeat(20);

    await expect(
      service.addScore(`  ${displayName}  `, 0),
    ).resolves.toMatchObject({
      name: displayName,
      score: 0,
    });
  });

  it.each([
    { name: '', score: 100 },
    { name: '   \n ', score: 100 },
    { name: 'A'.repeat(21), score: 100 },
    { name: 42, score: 100 },
    { name: null, score: 100 },
    { name: 'Ada', score: '100' },
    { name: 'Ada', score: null },
    { name: 'Ada', score: undefined },
    { name: 'Ada', score: Number.NaN },
    { name: 'Ada', score: Number.POSITIVE_INFINITY },
    { name: 'Ada', score: -25 },
    { name: 'Ada', score: 25.5 },
    { name: 'Ada', score: 42 },
    { name: 'Ada', score: 1001 },
    { name: 'Ada', score: 1025 },
  ])(
    'rejects an invalid submission before persistence: %p',
    async ({ name, score }) => {
      await expect(service.addScore(name, score)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      await expect(
        dataSource.getRepository(LeaderboardEntry).count(),
      ).resolves.toBe(0);
    },
  );

  it('ranks by score, then creation date and insertion order for deterministic ties', async () => {
    const later = await service.addScore('Later tied Player', 100);
    await service.addScore('Highest Player', 300);
    const first = await service.addScore('First tied Player', 100);
    const second = await service.addScore('Second tied Player', 100);
    await service.addScore('Zero Player', 0);

    const repository = dataSource.getRepository(LeaderboardEntry);
    await repository.update([first.id, second.id], {
      createdAt: new Date('2026-01-01T00:00:00Z'),
    });
    await repository.update(later.id, {
      createdAt: new Date('2026-01-02T00:00:00Z'),
    });

    const ranked = await service.getTopScores();
    expect(ranked.map((entry) => entry.name)).toEqual([
      'Highest Player',
      'First tied Player',
      'Second tied Player',
      'Later tied Player',
      'Zero Player',
    ]);
    const topTwo = await service.getTopScores(2);
    expect(topTwo.map((entry) => entry.name)).toEqual([
      'Highest Player',
      'First tied Player',
    ]);
  });
});
