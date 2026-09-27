# Configure Telegram delivery and proxy explicitly

Status: accepted

Supersedes [ADR-0005](0005-select-telegram-update-delivery-at-startup.md).

Require `TELEGRAM_WEBHOOK_ENABLED` whenever `TELEGRAM_BOT_TOKEN` is set. When it is `false`, delete the bot's webhook without dropping pending updates and use long polling for `inline_query`. When it is `true`, register the configured `/webhook` URL with Telegram, the shared webhook secret, and `inline_query` as the allowed update type. This makes each deployment's delivery mode explicit and allows the application to manage Telegram's remote webhook configuration. Development and production use separate bot tokens, with at most one active poller for each token; both environments use long polling for the current deployment target.

Route all outbound Telegram Bot API requests through `TELEGRAM_BOT_PROXY_URL` when it is set. The value is an optional SOCKS5 URL; use `socks-proxy-agent` with the Node HTTP client for these requests. When the variable is unset, connect directly. This keeps the proxy scoped to server-side Telegram traffic and avoids changing player network access. The tradeoff is that startup now sets or deletes Telegram's webhook according to deployment configuration, so each bot token must be dedicated to its Lush Guesser environment.

This ADR records the approved behavior; runtime support and deployment configuration remain to be implemented.
