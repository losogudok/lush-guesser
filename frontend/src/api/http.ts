import ky from 'ky';

export const http = ky.create({
  timeout: 10_000,
  totalTimeout: 15_000,
  retry: {
    limit: 2,
    // Retrying score submission could create a duplicate Leaderboard Entry.
    methods: ['get'],
    statusCodes: [408, 429, 500, 502, 503, 504],
  },
});
