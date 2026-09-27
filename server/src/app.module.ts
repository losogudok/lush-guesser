import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogModule } from './catalog/catalog.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { TelegramModule } from './telegram/telegram.module';
import { buildTypeOrmOptions } from './database';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: buildTypeOrmOptions,
    }),
    LeaderboardModule,
    CatalogModule,
    TelegramModule,
  ],
})
export class AppModule {}
