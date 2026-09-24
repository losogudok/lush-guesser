import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export interface TelegramInlineQuery {
  id?: unknown;
}

export interface TelegramUpdate {
  inline_query?: TelegramInlineQuery;
}

@Injectable()
export class TelegramBotService {
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const inlineQueryId = update.inline_query?.id;
    if (typeof inlineQueryId !== 'string' || inlineQueryId.length === 0) {
      return;
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL;
    if (!botToken || !miniAppUrl) {
      throw new ServiceUnavailableException(
        'Telegram inline mode is not configured',
      );
    }

    let appUrl: URL;
    try {
      appUrl = new URL(miniAppUrl);
    } catch {
      throw new ServiceUnavailableException(
        'Telegram Mini App URL must be an absolute HTTPS URL',
      );
    }
    if (appUrl.protocol !== 'https:' || appUrl.username || appUrl.password) {
      throw new ServiceUnavailableException(
        'Telegram Mini App URL must be an absolute HTTPS URL',
      );
    }

    let response: Response;
    try {
      response = await fetch(
        `https://api.telegram.org/bot${botToken}/answerInlineQuery`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            inline_query_id: inlineQueryId,
            results: [],
            cache_time: 0,
            is_personal: true,
            button: {
              text: 'Play Lush Scent Guesser',
              web_app: { url: appUrl.href },
            },
          }),
          signal: AbortSignal.timeout(5000),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'Telegram did not accept the inline query response',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Telegram did not accept the inline query response',
      );
    }

    let result: { ok?: unknown };
    try {
      result = (await response.json()) as { ok?: unknown };
    } catch {
      throw new ServiceUnavailableException(
        'Telegram returned an invalid inline query response',
      );
    }
    if (result.ok !== true) {
      throw new ServiceUnavailableException(
        'Telegram did not accept the inline query response',
      );
    }
  }
}
