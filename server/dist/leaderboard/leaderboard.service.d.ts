import { Repository } from 'typeorm';
import { LeaderboardEntry } from './leaderboard.entity';
export declare class LeaderboardService {
    private leaderboardRepository;
    constructor(leaderboardRepository: Repository<LeaderboardEntry>);
    getTopScores(limit?: number): Promise<LeaderboardEntry[]>;
    addScore(name: string, score: number): Promise<LeaderboardEntry>;
}
