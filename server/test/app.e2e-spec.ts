import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'lush-guesser-e2e-'));
    process.env.DATABASE_PATH = join(tempDir, 'database.sqlite');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/leaderboard (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/leaderboard')
      .expect(200)
      .expect([]);
  });

  it('/api/leaderboard (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/leaderboard')
      .send({ name: 'Ada', score: 42 })
      .expect(201);

    expect(response.body).toMatchObject({ name: 'Ada', score: 42 });
  });

  it('/api/leaderboard rejects invalid limits', async () => {
    await request(app.getHttpServer())
      .get('/api/leaderboard?limit=0')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/leaderboard?limit=-1')
      .expect(400);
    await request(app.getHttpServer())
      .get('/api/leaderboard?limit=abc')
      .expect(400);
  });

  it('/api/leaderboard rejects invalid score submissions', async () => {
    await request(app.getHttpServer())
      .post('/api/leaderboard')
      .send({ name: '', score: 42 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/leaderboard')
      .send({ name: 'Ada' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/leaderboard')
      .send({ name: 'Ada', score: -1 })
      .expect(400);
  });

  it('/api/leaderboard truncates long display names', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/leaderboard')
      .send({ name: 'This Name Is Longer Than Twenty Characters', score: 12 })
      .expect(201);

    const body = response.body as { name: string };
    expect(body.name).toBe('This Name Is Longer');
  });

  afterEach(async () => {
    await app.close();
    rmSync(tempDir, { recursive: true, force: true });
  });
});
