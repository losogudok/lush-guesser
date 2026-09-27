import { Injectable } from '@nestjs/common';
import * as https from 'node:https';
import { SocksProxyAgent } from 'socks-proxy-agent';

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
    const proxyUrl = process.env.TELEGRAM_BOT_PROXY_URL;
    const agent = proxyUrl
      ? (new SocksProxyAgent(proxyUrl) as unknown as https.Agent)
      : undefined;
    const headers = Object.fromEntries(new Headers(options.headers).entries());

    return new Promise<Response>((resolve, reject) => {
      const request = https.request(
        `https://api.telegram.org/bot${botToken}/${method}`,
        {
          method: options.method ?? 'GET',
          headers,
          ...(agent ? { agent } : {}),
          signal: options.signal ?? AbortSignal.timeout(5000),
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk: Buffer | string) => {
            chunks.push(Buffer.from(chunk));
          });
          response.on('error', reject);
          response.on('end', () => {
            resolve(
              new Response(Buffer.concat(chunks), {
                status: response.statusCode ?? 502,
                statusText: response.statusMessage,
                headers: new Headers(response.headers as HeadersInit),
              }),
            );
          });
        },
      );

      request.on('error', reject);
      if (options.body !== undefined) {
        request.write(options.body as string | Uint8Array);
      }
      request.end();
    });
  }
}
