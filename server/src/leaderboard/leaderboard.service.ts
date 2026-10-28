import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardEntry } from './leaderboard.entity';

const MAX_DISPLAY_NAME_LENGTH = 20;
const GAME_SESSION_ROUND_COUNT = 10;
const ROUND_POINT_VALUE = 100;
const SCORE_INCREMENT = 25;
const MAX_GAME_SESSION_SCORE = GAME_SESSION_ROUND_COUNT * ROUND_POINT_VALUE;

const normalizeDisplayName = (name: unknown): string => {
  if (typeof name !== 'string') {
    throw new BadRequestException('Display name must be a string.');
  }

  const normalizedName = name.trim();
  if (
    normalizedName.length === 0 ||
    normalizedName.length > MAX_DISPLAY_NAME_LENGTH
  ) {
    throw new BadRequestException(
      `Display name must contain 1 to ${MAX_DISPLAY_NAME_LENGTH} characters after trimming.`,
    );
  }

  return normalizedName;
};

const validateGameSessionScore = (score: unknown): number => {
  if (
    typeof score !== 'number' ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > MAX_GAME_SESSION_SCORE ||
    score % SCORE_INCREMENT !== 0
  ) {
    throw new BadRequestException(
      `Score must be a multiple of ${SCORE_INCREMENT} from 0 to ${MAX_GAME_SESSION_SCORE}, matching a feasible Game Session result.`,
    );
  }

  return score;
};

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private readonly leaderboardRepository: Repository<LeaderboardEntry>,
  ) {}

  async getTopScores(limit = 10): Promise<LeaderboardEntry[]> {
    return this.leaderboardRepository.find({
      order: { score: 'DESC', createdAt: 'ASC', id: 'ASC' },
      take: limit,
    });
  }

  async addScore(name: unknown, score: unknown): Promise<LeaderboardEntry> {
    const entry = this.leaderboardRepository.create({
      name: normalizeDisplayName(name),
      score: validateGameSessionScore(score),
    });
    return this.leaderboardRepository.save(entry);
  }
}
