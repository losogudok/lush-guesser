import { EventEmitter } from 'node:events';
import * as https from 'node:https';
import type { ClientRequest } from 'node:http';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { TelegramBotApiClient } from './telegram-bot-api.client';

jest.mock('node:https', () => {
  const actual = jest.requireActual<typeof import('node:https')>('node:https');
  return { ...actual, request: jest.fn() };
});

describe('TelegramBotApiClient proxy routing', () => {
  const previousProxyUrl = process.env.TELEGRAM_BOT_PROXY_URL;

  beforeEach(() => {
    jest.mocked(https.request).mockClear();
  });

  afterEach(() => {
    if (previousProxyUrl === undefined) {
      delete process.env.TELEGRAM_BOT_PROXY_URL;
    } else {
      process.env.TELEGRAM_BOT_PROXY_URL = previousProxyUrl;
    }
    jest.restoreAllMocks();
  });

  function mockRequestOptions(): Promise<https.RequestOptions> {
    const requestMock = jest.mocked(https.request);
    requestMock.mockImplementation(() => {
      const request = new EventEmitter() as ClientRequest;
      request.end = jest.fn();
      queueMicrotask(() => request.emit('error', new Error('request stopped')));
      return request;
    });

    return new TelegramBotApiClient()
      .getWebhookInfo('test-bot-token')
      .catch(() => undefined)
      .then(() => requestMock.mock.calls[0]?.[1] ?? {});
  }

  it('routes Bot API requests through the configured SOCKS5 proxy', async () => {
    process.env.TELEGRAM_BOT_PROXY_URL = 'socks5://proxy.example.test:1080';

    const options = await mockRequestOptions();

    expect(options.agent).toBeInstanceOf(SocksProxyAgent);
  });

  it('connects directly when no proxy is configured', async () => {
    delete process.env.TELEGRAM_BOT_PROXY_URL;

    const options = await mockRequestOptions();

    expect(options.agent).toBeUndefined();
  });
});
