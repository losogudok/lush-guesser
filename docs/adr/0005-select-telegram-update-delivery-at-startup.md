# Select Telegram update delivery at startup

Status: superseded by [ADR-0006](0006-configure-telegram-delivery-and-proxy-explicitly.md)

At startup, use Telegram's existing webhook when it matches the application's configured `/webhook` URL, and use long polling for `inline_query` only when no webhook is configured. A nonempty mismatched webhook is left untouched and prevents startup, avoiding an implicit change to operator-owned Telegram configuration; polling requires one active backend instance per bot token.
