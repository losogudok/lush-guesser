import { LeaderboardService } from './leaderboard.service';
import { LeaderboardEntry } from './leaderboard.entity';
export declare class LeaderboardController {
    private readonly leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getLeaderboard(limit?: string): Promise<LeaderboardEntry[]>;
    saveScore(name: string, score: number): Promise<LeaderboardEntry>;
}
