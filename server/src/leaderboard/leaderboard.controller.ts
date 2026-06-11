/* eslint-disable prettier/prettier */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardEntry } from './leaderboard.entity';

@Controller('api/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(@Query('limit') limit?: string): Promise<LeaderboardEntry[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 10;
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      throw new BadRequestException('Invalid limit parameter');
    }
    return this.leaderboardService.getTopScores(parsedLimit);
  }

  @Post()
  async saveScore(
    @Body('name') name: string,
    @Body('score') score: number,
  ): Promise<LeaderboardEntry> {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestException('Name is required and must be a non-empty string');
    }
    if (score === undefined || score === null || typeof score !== 'number' || score < 0) {
      throw new BadRequestException('Score is required and must be a non-negative number');
    }
    return this.leaderboardService.addScore(name.trim().substring(0, 20), score);
  }
}
