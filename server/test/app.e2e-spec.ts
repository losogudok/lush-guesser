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
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.TELEGRAM_MINI_APP_URL = 'https://lush.example.test/';
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

  it('/webhook rejects updates without the configured Telegram secret', async () => {
    await request(app.getHttpServer())
      .post('/webhook')
      .send({ inline_query: { id: 'query-1' } })
      .expect(401);
  });

  it('/webhook rejects malformed inline queries', async () => {
    await request(app.getHttpServer())
      .post('/webhook')
      .set('x-telegram-bot-api-secret-token', 'test-webhook-secret')
      .send({ inline_query: 'invalid' })
      .expect(400);
  });

  it('/webhook answers inline queries with a Mini App launch button', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, result: true }),
    } as Response);

    await request(app.getHttpServer())
      .post('/webhook')
      .set('x-telegram-bot-api-secret-token', 'test-webhook-secret')
      .send({ inline_query: { id: 'query-1', query: '' } })
      .expect(200)
      .expect({ ok: true });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.telegram.org/bottest-bot-token/answerInlineQuery',
      expect.objectContaining({ method: 'POST' }),
    );
    const requestBody = JSON.parse(
      fetchSpy.mock.calls[0][1]?.body as string,
    ) as Record<string, unknown>;
    expect(requestBody).toMatchObject({
      inline_query_id: 'query-1',
      results: [],
      button: {
        text: 'Play Lush Scent Guesser',
        web_app: { url: 'https://lush.example.test/' },
      },
    });

    fetchSpy.mockRestore();
  });

  it('/webhook acknowledges unrelated Telegram updates without posting to chat', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    await request(app.getHttpServer())
      .post('/webhook')
      .set('x-telegram-bot-api-secret-token', 'test-webhook-secret')
      .send({ message: { text: 'hello' } })
      .expect(200)
      .expect({ ok: true });

    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  afterEach(async () => {
    await app.close();
    jest.restoreAllMocks();
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_WEBHOOK_SECRET;
    delete process.env.TELEGRAM_MINI_APP_URL;
  });
});
