import { Module } from '@nestjs/common';
import { TelegramBotApiClient } from './telegram-bot-api.client';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramWebhookController } from './telegram-webhook.controller';

@Module({
  controllers: [TelegramWebhookController],
  providers: [TelegramBotApiClient, TelegramBotService],
})
export class TelegramModule {}
