import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LeaderboardEntry } from './leaderboard/leaderboard.entity';
import { CreateLeaderboard1710000000000 } from './migrations/1710000000000-CreateLeaderboard';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const isProduction = process.env.NODE_ENV === 'production';

        return {
          type: 'sqlite',
          database: process.env.DATABASE_PATH ?? 'database.sqlite',
          entities: [LeaderboardEntry],
          migrations: [CreateLeaderboard1710000000000],
          migrationsRun: isProduction,
          synchronize: !isProduction,
        };
      },
    }),
    LeaderboardModule,
    TelegramModule,
  ],
})
export class AppModule {}
