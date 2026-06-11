import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LeaderboardEntry } from './leaderboard/leaderboard.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DATABASE_PATH ?? 'database.sqlite',
      entities: [LeaderboardEntry],
      synchronize: true,
    }),
    LeaderboardModule,
  ],
})
export class AppModule {}
