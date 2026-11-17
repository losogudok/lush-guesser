import { http } from './http';

export interface LeaderboardEntry {
  id: number;
  name: string;
  score: number;
  createdAt: string;
  sample?: boolean;
}

export function getLeaderboard(signal?: AbortSignal): Promise<LeaderboardEntry[]> {
  return http.get('/api/leaderboard', {
    searchParams: { limit: 20 },
    signal,
  }).json<LeaderboardEntry[]>();
}

export async function submitScore(entry: {
  name: string;
  score: number;
}): Promise<void> {
  await http.post('/api/leaderboard', { json: entry });
}
