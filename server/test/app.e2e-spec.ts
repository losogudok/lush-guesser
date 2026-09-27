import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import type { ClientRequest, IncomingMessage } from 'node:http';
import * as https from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { TelegramBotApiClient } from './../src/telegram/telegram-bot-api.client';

jest.mock('node:https', () => {
  const actual = jest.requireActual<typeof import('node:https')>('node:https');
  return { ...actual, request: jest.fn() };
});

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let tempDir: string;

  beforeEach(async () => {
    jest.mocked(https.request).mockReset();
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.TELEGRAM_MINI_APP_URL = 'https://lush.example.test/';
    tempDir = mkdtempSync(join(tmpdir(), 'lush-guesser-e2e-'));
    process.env.DATABASE_PATH = join(tempDir, 'database.sqlite');
    const telegramApi = new TelegramBotApiClient();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(TelegramBotApiClient)
      .useValue({
        getWebhookInfo: jest.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              ok: true,
              result: {
                url: 'https://lush.example.test/webhook',
                allowed_updates: ['inline_query'],
                pending_update_count: 0,
              },
            }),
        }),
        answerInlineQuery: telegramApi.answerInlineQuery.bind(telegramApi),
      })
      .compile();

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
    const requestMock = jest.mocked(https.request);
    let requestBody = '';
    requestMock.mockImplementation((url, options, callback) => {
      expect(url).toBe(
        'https://api.telegram.org/bottest-bot-token/answerInlineQuery',
      );
      expect(options?.method).toBe('POST');
      const outgoingRequest = new EventEmitter() as ClientRequest;
      outgoingRequest.write = jest.fn((chunk: string | Uint8Array) => {
        requestBody = Buffer.from(chunk).toString();
        return true;
      });
      outgoingRequest.end = jest.fn(() => {
        const response = Readable.from([
          JSON.stringify({ ok: true, result: true }),
        ]);
        Object.assign(response, {
          statusCode: 200,
          statusMessage: 'OK',
          headers: { 'content-type': 'application/json' },
        });
        callback?.(response as IncomingMessage);
      });
      return outgoingRequest;
    });

    await request(app.getHttpServer())
      .post('/webhook')
      .set('x-telegram-bot-api-secret-token', 'test-webhook-secret')
      .send({ inline_query: { id: 'query-1', query: '' } })
      .expect(200)
      .expect({ ok: true });

    expect(requestMock).toHaveBeenCalledTimes(1);
    const parsedRequestBody = JSON.parse(requestBody) as Record<
      string,
      unknown
    >;
    expect(parsedRequestBody).toMatchObject({
      inline_query_id: 'query-1',
      results: [],
      button: {
        text: 'Play Lush Scent Guesser',
        web_app: { url: 'https://lush.example.test/' },
      },
    });
  });

  it('/webhook acknowledges unrelated Telegram updates without posting to chat', async () => {
    const requestMock = jest.mocked(https.request);

    await request(app.getHttpServer())
      .post('/webhook')
      .set('x-telegram-bot-api-secret-token', 'test-webhook-secret')
      .send({ message: { text: 'hello' } })
      .expect(200)
      .expect({ ok: true });

    expect(requestMock).not.toHaveBeenCalled();
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
