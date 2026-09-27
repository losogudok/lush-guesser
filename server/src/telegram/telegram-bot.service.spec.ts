import { Logger } from '@nestjs/common';
import { TelegramBotApiClient } from './telegram-bot-api.client';
import { TelegramBotService } from './telegram-bot.service';

function telegramResponse(result: unknown): Response {
  return new Response(JSON.stringify({ ok: true, result }), {
    headers: { 'content-type': 'application/json' },
  });
}

describe('TelegramBotService polling startup', () => {
  let previousEnvironment: Record<string, string | undefined>;

  beforeEach(() => {
    previousEnvironment = {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET,
      TELEGRAM_MINI_APP_URL: process.env.TELEGRAM_MINI_APP_URL,
    };
    process.env.TELEGRAM_BOT_TOKEN = 'test-bot-token';
    process.env.TELEGRAM_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.TELEGRAM_MINI_APP_URL = 'https://lush.example.test/';
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    jest.restoreAllMocks();
  });

  it('starts polling when webhook is missing and advances past unrelated updates', async () => {
    const getUpdates = jest.fn(
      (
        _botToken: string,
        offset: number | undefined,
        signal: AbortSignal,
      ): Promise<Response> => {
        if (offset === undefined) {
          return Promise.resolve(
            telegramResponse([
              { update_id: 10, message: { text: 'older pending update' } },
            ]),
          );
        }

        return new Promise<Response>((_resolve, reject) => {
          const rejectOnAbort = (): void => reject(new Error('poll stopped'));
          if (signal.aborted) {
            rejectOnAbort();
            return;
          }
          signal.addEventListener('abort', rejectOnAbort, { once: true });
        });
      },
    );
    const telegramApi = {
      getWebhookInfo: jest
        .fn()
        .mockResolvedValue(
          telegramResponse({ url: '', allowed_updates: null }),
        ),
      getUpdates,
      answerInlineQuery: jest.fn(),
    } as unknown as TelegramBotApiClient;
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const service = new TelegramBotService(telegramApi);

    await service.onApplicationBootstrap();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    try {
      expect(warn).toHaveBeenCalledWith(
        'Telegram returned malformed allowed_updates; continuing in the selected mode',
      );
      expect(getUpdates).toHaveBeenNthCalledWith(
        1,
        'test-bot-token',
        undefined,
        expect.any(AbortSignal),
      );
      expect(getUpdates).toHaveBeenNthCalledWith(
        2,
        'test-bot-token',
        11,
        expect.any(AbortSignal),
      );
    } finally {
      await service.onModuleDestroy();
    }
  });
});
