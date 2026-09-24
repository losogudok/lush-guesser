import {
  Controller,
  BadRequestException,
  Headers,
  HttpCode,
  Post,
  ServiceUnavailableException,
  UnauthorizedException,
  Body,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import {
  TelegramBotService,
  type TelegramUpdate,
} from './telegram-bot.service';

@Controller('webhook')
export class TelegramWebhookController {
  constructor(private readonly telegramBot: TelegramBotService) {}

  @Post()
  @HttpCode(200)
  async handleUpdate(
    @Body() body: unknown,
    @Headers('x-telegram-bot-api-secret-token') receivedSecret?: string,
  ): Promise<{ ok: true }> {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!expectedSecret) {
      throw new ServiceUnavailableException(
        'Telegram webhook is not configured',
      );
    }
    if (!this.matchesSecret(expectedSecret, receivedSecret)) {
      throw new UnauthorizedException('Invalid Telegram webhook secret');
    }

    if (!this.isTelegramUpdate(body)) {
      throw new BadRequestException('Invalid Telegram update');
    }

    const update = body;
    await this.telegramBot.handleUpdate(update);
    return { ok: true };
  }

  private isTelegramUpdate(body: unknown): body is TelegramUpdate {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      return false;
    }

    const inlineQuery = (body as Record<string, unknown>).inline_query;
    if (inlineQuery === undefined) {
      return true;
    }
    if (
      inlineQuery === null ||
      typeof inlineQuery !== 'object' ||
      Array.isArray(inlineQuery)
    ) {
      return false;
    }

    const queryId = (inlineQuery as Record<string, unknown>).id;
    return typeof queryId === 'string' && queryId.length > 0;
  }

  private matchesSecret(expected: string, received?: string): boolean {
    if (received === undefined) {
      return false;
    }
    const expectedHash = createHash('sha256').update(expected).digest();
    const receivedHash = createHash('sha256').update(received).digest();
    return timingSafeEqual(expectedHash, receivedHash);
  }
}
