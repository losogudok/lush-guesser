import { Injectable } from '@nestjs/common';

export interface TelegramInlineQueryAnswer {
  inline_query_id: string;
  results: unknown[];
  cache_time: number;
  is_personal: boolean;
  button: {
    text: string;
    web_app: { url: string };
  };
}

@Injectable()
export class TelegramBotApiClient {
  getWebhookInfo(botToken: string): Promise<Response> {
    return this.request(botToken, 'getWebhookInfo');
  }

  getUpdates(
    botToken: string,
    offset: number | undefined,
    signal: AbortSignal,
  ): Promise<Response> {
    return this.request(botToken, 'getUpdates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...(offset === undefined ? {} : { offset }),
        timeout: 30,
        allowed_updates: ['inline_query'],
      }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(35_000)]),
    });
  }

  answerInlineQuery(
    botToken: string,
    answer: TelegramInlineQueryAnswer,
  ): Promise<Response> {
    return this.request(botToken, 'answerInlineQuery', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(answer),
    });
  }

  private request(
    botToken: string,
    method: string,
    options: RequestInit = {},
  ): Promise<Response> {
    return fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      ...options,
      signal: options.signal ?? AbortSignal.timeout(5000),
    });
  }
}
