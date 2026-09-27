import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as https from 'node:https';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { CatalogService } from './../src/catalog/catalog.service';
import { TelegramBotApiClient } from './../src/telegram/telegram-bot-api.client';

jest.mock('node:https', () => {
  const actual = jest.requireActual<typeof import('node:https')>('node:https');
  return { ...actual, request: jest.fn() };
});

describe('Catalog (e2e)', () => {
  let app: INestApplication<App>;
  let tempDir: string;

  beforeEach(async () => {
    jest.mocked(https.request).mockReset();
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.TELEGRAM_MINI_APP_URL = 'https://lush.example.test/';
    tempDir = mkdtempSync(join(tmpdir(), 'lush-guesser-catalog-'));
    process.env.DATABASE_PATH = join(tempDir, 'database.sqlite');

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
        answerInlineQuery: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  const createIngredient = async (en: string, ru: string) => {
    const catalogService = app.get(CatalogService);
    // The admin ingredient endpoints arrive with ticket #21; tests create
    // Ingredients through the service, which derives the slug from the en name.
    await catalogService.createIngredient({ en, ru });
  };

  const postProduct = (overrides: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post('/api/catalog/products')
      .send({
        name: { en: 'Confetti', ru: 'Confetti' },
        description: { en: 'English.', ru: 'Русское.' },
        color: '#A779B8',
        clues: ['rose', 'sandalwood'],
        ...overrides,
      });

  it('/api/catalog (GET) returns an empty list while nothing is seeded', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/catalog')
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it('/api/catalog/products (POST) rejects a Product with one Ingredient Clue', async () => {
    await createIngredient('Rose', 'Роза');
    const response = await postProduct({
      color: '#A779B8',
      clues: ['rose'],
    }).expect(400);

    expect(JSON.stringify(response.body)).toMatch(/Ingredient Clues/);
  });

  it('/api/catalog/products (POST) rejects a Product with five Ingredient Clues', async () => {
    await createIngredient('Rose', 'Роза');
    await createIngredient('Sandalwood', 'Сандал');
    await createIngredient('Violet', 'Фиалка');
    await createIngredient('Tonka Bean', 'Тонка');
    const response = await postProduct({
      color: '#A779B8',
      clues: ['rose', 'sandalwood', 'violet', 'tonka-bean', 'unicorn-tears'],
    }).expect(400);

    expect(JSON.stringify(response.body)).toMatch(/Ingredient Clues/);
  });

  it('/api/catalog/products (POST) rejects a Product with a non-string Ingredient Clue', async () => {
    await createIngredient('Rose', 'Роза');
    await createIngredient('Sandalwood', 'Сандал');
    await postProduct({
      color: '#A779B8',
      clues: ['rose', 42],
    }).expect(400);
  });

  it('/api/catalog/products (POST) rejects a Product missing the ru name field', async () => {
    await createIngredient('Rose', 'Роза');
    await createIngredient('Sandalwood', 'Сандал');
    const response = await postProduct({
      name: { en: 'Confetti' },
      color: '#A779B8',
      clues: ['rose', 'sandalwood'],
    }).expect(400);

    expect(JSON.stringify(response.body)).toMatch(/name/);
  });

  it('/api/catalog/products (POST) rejects a Product with a bad hex color', async () => {
    await createIngredient('Rose', 'Роза');
    await createIngredient('Sandalwood', 'Сандал');
    const response = await postProduct({
      color: 'red',
      clues: ['rose', 'sandalwood'],
    }).expect(400);

    expect(JSON.stringify(response.body)).toMatch(/display color/);
  });

  it('/api/catalog/products (POST) rejects a Product referencing a missing Ingredient', async () => {
    await createIngredient('Rose', 'Роза');
    await createIngredient('Sandalwood', 'Сандал');
    const response = await postProduct({
      color: '#A779B8',
      clues: ['rose', 'unicorn-tears'],
    }).expect(400);

    expect(JSON.stringify(response.body)).toMatch(/unicorn-tears/);
  });

  it('/api/catalog accepts a valid Product, defaulting the in-game flag to enabled', async () => {
    await createIngredient('Lavender', 'Лаванда');
    await createIngredient('Tonka Bean', 'Тонка');
    await postProduct({
      name: { en: 'Twilight', ru: 'Twilight' },
      clues: ['lavender', 'tonka-bean'],
    }).expect(201);

    const response = await request(app.getHttpServer())
      .get('/api/catalog')
      .expect(200);

    const products = response.body as Array<{
      slug: string;
      inGame: boolean;
      clues: Array<{ slug: string }>;
    }>;

    expect(products).toHaveLength(1);
    expect(products[0].slug).toBe('twilight');
    expect(products[0].inGame).toBe(true);
    expect(products[0].clues.map((clue) => clue.slug)).toEqual([
      'lavender',
      'tonka-bean',
    ]);
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
