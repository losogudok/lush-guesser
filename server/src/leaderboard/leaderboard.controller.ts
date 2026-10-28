import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardEntry } from './leaderboard.entity';

@Controller('api/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Query('limit') limit?: string,
  ): Promise<LeaderboardEntry[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      throw new BadRequestException('Invalid limit parameter');
    }
    return this.leaderboardService.getTopScores(parsedLimit);
  }

  @Post()
  async saveScore(
    @Body('name') name: unknown,
    @Body('score') score: unknown,
  ): Promise<LeaderboardEntry> {
    return this.leaderboardService.addScore(name, score);
  }
}
