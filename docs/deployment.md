# Deployment

GitHub Actions deploys `dev` to development and `main` to production after the quality and production-image checks pass. Production promotion is restricted to pull requests from `dev`.

| Setting | Development | Production |
| --- | --- | --- |
| GitHub Environment | `development` | `production` |
| URL | `https://lush-dev.lookmaimanengineer.cc` | `https://lush.lookmaimanengineer.cc` |
| Checkout | `/opt/lush-guesser/dev` | `/opt/lush-guesser/prod` |
| Compose project | `lush-guesser-dev` | `lush-guesser-prod` |
| Frontend socket directory | `/run/lush-guesser/dev` | `/run/lush-guesser/prod` |
| Leaderboard volume | `lush-guesser-dev-data` | `lush-guesser-prod-data` |

Both environments run production images on the same Docker host. Host Nginx at `192.168.0.9` terminates HTTPS and proxies to the environment-specific frontend Unix socket. The frontend Nginx container serves the built app on that socket and proxies `/api` and `/webhook` to the backend service.

## GitHub configuration

Repository secrets:

- `DEPLOY_HOST`: public SSH endpoint forwarding to the Docker host
- `DEPLOY_USER`: deployment account
- `DEPLOY_PORT`: forwarded SSH port
- `DEPLOY_SSH_KEY`: complete private key for the deployment account

Environment variables:

| Variable | Development | Production |
| --- | --- | --- |
| `DEPLOY_ENABLED` | `true` | enable only after host checks pass |
| `DEPLOY_URL` | `https://lush-dev.lookmaimanengineer.cc` | `https://lush.lookmaimanengineer.cc` |
| `DEPLOY_PATH` | `/opt/lush-guesser/dev` | `/opt/lush-guesser/prod` |
| `COMPOSE_PROJECT_NAME` | `lush-guesser-dev` | `lush-guesser-prod` |
| `FRONTEND_SOCKET_DIR` | `/run/lush-guesser/dev` | `/run/lush-guesser/prod` |
| `LEADERBOARD_VOLUME_NAME` | `lush-guesser-dev-data` | `lush-guesser-prod-data` |

Production deployment must remain disabled until Nginx, certificates, socket directories, and the SSH key are verified. A push to `main` then deploys the exact commit, checks the local socket and public HTTPS endpoint, and rolls back to the previous successful commit if health verification fails.

## Host provisioning

Install `deploy/tmpfiles.d/lush-guesser.conf` as a tmpfiles rule, mount `/run/lush-guesser` into the Nginx container using `deploy/nginx/docker-compose.override.yml`, and install `deploy/nginx/lush-guesser.conf` in the host Nginx configuration. Validate the Nginx configuration before recreating the proxy.

The deployment scripts preserve the Leaderboard Entry volume and migrate a legacy `data/database.sqlite` file only when the target volume has no database.

## Telegram inline mode

The settings below describe the approved target configuration. The backend supports `TELEGRAM_BOT_PROXY_URL`; runtime support for `TELEGRAM_WEBHOOK_ENABLED` is not implemented yet, so update delivery continues to follow [ADR-0005](adr/0005-select-telegram-update-delivery-at-startup.md).

After implementation, set these values in a deployment-owned `.env` file beside the Compose file; keep that file out of version control and restrict it to the deployment account. Include the environment's `COMPOSE_PROJECT_NAME` from the table above. GitHub Actions supplies it during deployment, while the `.env` value lets interactive `docker compose` commands target the same project without `-p`:

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API credential; use a distinct bot token in development and production |
| `TELEGRAM_WEBHOOK_ENABLED` | Required explicit `true` or `false` when the bot token is set. Use `false` in both environments for the current deployment target |
| `TELEGRAM_WEBHOOK_SECRET` | Required when webhook mode is enabled; checked against Telegram's `X-Telegram-Bot-Api-Secret-Token` header |
| `TELEGRAM_MINI_APP_URL` | Public HTTPS URL opened by the inline Mini App button and used to derive `/webhook` |
| `TELEGRAM_BOT_PROXY_URL` | Optional SOCKS5 URL for outbound Telegram Bot API requests, such as `socks5://<username>:<password>@<host>:1080`. If unset, requests connect directly |

When `TELEGRAM_WEBHOOK_ENABLED=false`, startup deletes the webhook without dropping pending updates, then starts long polling for `inline_query`. When it is `true`, startup registers `/webhook` on the origin of `TELEGRAM_MINI_APP_URL` with Telegram and uses webhook delivery; the webhook fails closed when its secret is absent or invalid. Inline queries are answered with a Mini App button and no chat message is sent. `getUpdates` polling and webhook delivery cannot be active for the same bot token at once. Run at most one backend poller per token, and use separate bot tokens for development and production.

When `TELEGRAM_BOT_PROXY_URL` is set, route outbound Bot API requests—including webhook registration/deletion, polling, and inline-query answers—through that SOCKS5 proxy. The proxy must be reachable from the backend container. The proxy URL may omit its port when the server listens on the SOCKS default port `1080`; URL-encode reserved characters in credentials. The proxy affects server-to-Telegram requests only; Telegram's incoming webhook requests and players' Telegram connectivity do not use it.
