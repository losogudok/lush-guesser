import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  TelegramBotApiClient,
  type TelegramInlineQueryAnswer,
} from './telegram-bot-api.client';

export interface TelegramInlineQuery {
  id?: unknown;
}

export interface TelegramUpdate {
  update_id?: unknown;
  inline_query?: TelegramInlineQuery;
}

interface TelegramWebhookInfo {
  url?: unknown;
  allowed_updates?: unknown;
  pending_update_count?: unknown;
  last_error_message?: unknown;
  last_error_date?: unknown;
  last_synchronization_error_date?: unknown;
}

@Injectable()
export class TelegramBotService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(TelegramBotService.name);
  private pollingAbortController?: AbortController;
  private pollingTask?: Promise<void>;

  constructor(private readonly telegramApi: TelegramBotApiClient) {}

  async onApplicationBootstrap(): Promise<void> {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      this.logger.debug(
        'Telegram integration is skipped because TELEGRAM_BOT_TOKEN is unset',
      );
      return;
    }

    const miniAppUrl = process.env.TELEGRAM_MINI_APP_URL;
    if (!miniAppUrl) {
      throw new Error(
        'TELEGRAM_MINI_APP_URL is required when TELEGRAM_BOT_TOKEN is set',
      );
    }

    let expectedWebhookUrl: string;
    try {
      const appUrl = new URL(miniAppUrl);
      if (appUrl.protocol !== 'https:' || appUrl.username || appUrl.password) {
        throw new Error('Mini App URL must be an absolute HTTPS URL');
      }
      expectedWebhookUrl = new URL('/webhook', appUrl).href;
    } catch {
      throw new Error(
        'TELEGRAM_MINI_APP_URL must be an absolute HTTPS URL when Telegram is enabled',
      );
    }

    const webhookInfo = await this.fetchWebhookInfoOrThrow(botToken);
    const webhookUrl = webhookInfo.url;
    const allowedUpdatesSummary = this.getAllowedUpdatesSummary(
      webhookInfo.allowed_updates,
    );
    const pendingUpdates = this.getPendingUpdatesSummary(
      webhookInfo.pending_update_count,
    );
    const webhookUrlSummary =
      typeof webhookUrl === 'string' ? webhookUrl || 'unset' : 'invalid';
    this.logger.log(
      [
        `Telegram webhook status: url=${webhookUrlSummary}`,
        `allowed_updates=${allowedUpdatesSummary}`,
        `pending_updates=${pendingUpdates}`,
      ].join('; '),
    );
    this.logWebhookErrors(webhookInfo);
    const malformedAllowedUpdates = this.isAllowedUpdatesMalformed(
      webhookInfo.allowed_updates,
    );
    if (malformedAllowedUpdates) {
      this.logger.warn(
        'Telegram returned malformed allowed_updates; continuing in the selected mode',
      );
    }

    if (webhookUrl === '') {
      this.startPolling(botToken);
      return;
    }

    if (typeof webhookUrl !== 'string') {
      throw new Error('Telegram returned an invalid webhook URL');
    }
    if (webhookUrl !== expectedWebhookUrl) {
      throw new Error(
        `Telegram webhook URL does not match the expected URL (${expectedWebhookUrl}); refusing to change Telegram configuration`,
      );
    }

    if (
      !this.isAllowedUpdatesMalformed(webhookInfo.allowed_updates) &&
      !this.isInlineQueryEnabled(webhookInfo.allowed_updates)
    ) {
      throw new Error(
        'Telegram webhook is not subscribed to inline_query updates',
      );
    }
    if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
      throw new Error(
        'TELEGRAM_WEBHOOK_SECRET is required when Telegram webhook mode is active',
      );
    }

    this.logger.log('Telegram webhook mode is ready');
  }

  async onModuleDestroy(): Promise<void> {
    this.pollingAbortController?.abort();
    await this.pollingTask;
  }

  private async fetchWebhookInfoOrThrow(
    botToken: string,
  ): Promise<TelegramWebhookInfo> {
    try {
      const response = await this.telegramApi.getWebhookInfo(botToken);
      if (!response.ok) {
        throw new Error(`Telegram returned HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        ok?: unknown;
        result?: unknown;
      };
      if (
        payload.ok !== true ||
        payload.result === undefined ||
        typeof payload.result !== 'object' ||
        payload.result === null ||
        Array.isArray(payload.result)
      ) {
        throw new Error('Telegram returned an invalid webhook status response');
      }

      return payload.result;
    } catch (error) {
      throw new Error(
        'Could not verify Telegram webhook status; refusing to start',
        { cause: error },
      );
    }
  }

  private startPolling(botToken: string): void {
    this.logger.log(
      'Telegram webhook is not configured; starting inline_query polling',
    );
    this.pollingAbortController = new AbortController();
    this.pollingTask = this.pollUpdates(
      botToken,
      this.pollingAbortController.signal,
    );
  }

  private async pollUpdates(
    botToken: string,
    signal: AbortSignal,
  ): Promise<void> {
    let offset: number | undefined;
    let retryDelayMs = 1000;

    while (!signal.aborted) {
      try {
        const response = await this.telegramApi.getUpdates(
          botToken,
          offset,
          signal,
        );
        if (response.status === 409) {
          const webhookInfo = await this.fetchWebhookInfoOrThrow(botToken);
          if (
            typeof webhookInfo.url === 'string' &&
            webhookInfo.url.length > 0
          ) {
            this.logger.warn(
              'A webhook was configured while polling; stopping the polling loop',
            );
            return;
          }
          throw new Error('Another Telegram polling client is active');
        }
        if (!response.ok) {
          throw new Error(`Telegram returned HTTP ${response.status}`);
        }

        const payload = (await response.json()) as {
          ok?: unknown;
          result?: unknown;
        };
        if (payload.ok !== true || !Array.isArray(payload.result)) {
          throw new Error('Telegram returned an invalid getUpdates response');
        }
        retryDelayMs = 1000;

        for (const rawUpdate of payload.result) {
          if (
            rawUpdate === null ||
            typeof rawUpdate !== 'object' ||
            Array.isArray(rawUpdate)
          ) {
            throw new Error('Telegram returned a malformed update');
          }
          const updateId = (rawUpdate as Record<string, unknown>).update_id;
          if (
            typeof updateId !== 'number' ||
            !Number.isInteger(updateId) ||
            updateId < 0
          ) {
            throw new Error(
              'Telegram returned an update without a valid update_id',
            );
          }

          await this.handleUpdate(rawUpdate as TelegramUpdate);
          offset = updateId + 1;
        }
      } catch {
        if (signal.aborted) {
          break;
        }
        this.logger.warn('Telegram polling request failed; retrying shortly');
        await this.waitBeforeRetry(signal, retryDelayMs);
        retryDelayMs = Math.min(retryDelayMs * 2, 30_000);
      }
    }
  }

  private async waitBeforeRetry(
    signal: AbortSignal,
    delayMs: number,
  ): Promise<void> {
    if (signal.aborted) {
      return;
    }

    await new Promise<void>((resolve) => {
      const timeout: { id?: ReturnType<typeof setTimeout> } = {};
      const finish = (): void => {
        if (timeout.id) {
          clearTimeout(timeout.id);
        }
        signal.removeEventListener('abort', onAbort);
        resolve();
      };
      const onAbort = (): void => finish();
      timeout.id = setTimeout(finish, delayMs);
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) {
        finish();
      }
    });
  }

  private isAllowedUpdatesMalformed(value: unknown): boolean {
    return (
      value !== undefined &&
      (!Array.isArray(value) ||
        !value.every((update): update is string => typeof update === 'string'))
    );
  }

  private isInlineQueryEnabled(value: unknown): boolean {
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      return true;
    }
    return (
      Array.isArray(value) &&
      value.every((update): update is string => typeof update === 'string') &&
      value.includes('inline_query')
    );
  }

  private getAllowedUpdatesSummary(value: unknown): string {
    if (value === undefined || (Array.isArray(value) && value.length === 0)) {
      return 'default (includes inline_query)';
    }
    if (this.isAllowedUpdatesMalformed(value)) {
      return 'malformed';
    }
    return JSON.stringify(value) ?? 'unknown';
  }

  private getPendingUpdatesSummary(value: unknown): string {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0
      ? String(value)
      : 'unknown';
  }

  private logWebhookErrors(info: TelegramWebhookInfo): void {
    const lastErrorMessage = info.last_error_message;
    const lastErrorDate = info.last_error_date;
    if (
      typeof lastErrorMessage === 'string' ||
      typeof lastErrorDate === 'number'
    ) {
      const timestamp = this.formatUnixTimestamp(lastErrorDate);
      const errorDetails = [
        timestamp ? `at ${timestamp}` : undefined,
        typeof lastErrorMessage === 'string' ? lastErrorMessage : undefined,
      ].filter((detail): detail is string => detail !== undefined);
      this.logger.warn(
        `Telegram reports a webhook delivery error${errorDetails.length ? ` (${errorDetails.join('; ')})` : ''}`,
      );
    }

    if (typeof info.last_synchronization_error_date === 'number') {
      const timestamp = this.formatUnixTimestamp(
        info.last_synchronization_error_date,
      );
      this.logger.warn(
        `Telegram reports a webhook synchronization error${timestamp ? ` at ${timestamp}` : ''}`,
      );
    }
  }

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

    const answer: TelegramInlineQueryAnswer = {
      inline_query_id: inlineQueryId,
      results: [],
      cache_time: 0,
      is_personal: true,
      button: {
        text: 'Play Lush Scent Guesser',
        web_app: { url: appUrl.href },
      },
    };

    let response: Response;
    try {
      response = await this.telegramApi.answerInlineQuery(botToken, answer);
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

  private formatUnixTimestamp(value: unknown): string | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return undefined;
    }

    const timestamp = new Date(value * 1000);
    return Number.isNaN(timestamp.getTime())
      ? undefined
      : timestamp.toISOString();
  }
}
