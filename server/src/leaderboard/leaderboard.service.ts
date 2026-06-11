import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardEntry } from './leaderboard.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private leaderboardRepository: Repository<LeaderboardEntry>,
  ) {}

  async getTopScores(limit = 10): Promise<LeaderboardEntry[]> {
    return this.leaderboardRepository.find({
      order: { score: 'DESC', createdAt: 'ASC' },
      take: limit,
    });
  }

  async addScore(name: string, score: number): Promise<LeaderboardEntry> {
    const entry = this.leaderboardRepository.create({ name, score });
    return this.leaderboardRepository.save(entry);
  }
}
