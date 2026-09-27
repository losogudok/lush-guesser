# Launch the Telegram Mini App through inline mode

Status: accepted

Use one Telegram bot, handled inside the NestJS service at `https://lush.lookmaimanengineer.cc/webhook`, only to launch the existing full game as a Telegram Mini App from inline mode in any chat; keep the web game available. Both clients share the global leaderboard with arbitrary display names and client-trusted scores, without Telegram identity or account data. Game Sessions remain solo and private, are not resumable, and are discarded if the Mini App closes before completion; the tradeoff is simpler gameplay and identity handling at the cost of losing interrupted sessions and accepting forgeable scores.
