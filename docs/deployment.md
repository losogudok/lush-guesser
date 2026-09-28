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

## Admin catalog API

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Shared admin secret required to write catalog data. `POST /api/catalog/products` accepts it in the `x-admin-password` request header; the endpoint fails closed with 401 when the variable is unset or empty |

Until proper admin authentication ships (#20), Product creation is guarded by this shared secret. Every deployment must set a distinct, non-empty value; catalog `GET` endpoints stay public and read-only.

## Leaderboard backup and restore

Leaderboard Entries live in `database.sqlite` inside the environment's Leaderboard volume (`/app/data` in the backend container). The backend image ships two operator commands, safe against a live app and against failed runs:

- `node dist/ops/backup.js <output-file-or-directory>` — consistent snapshot via the SQLite Online Backup API, safe to run while the backend is serving traffic. An existing directory receives a `leaderboard-<YYYYMMDD-HHMMSS>.sqlite` file; an explicit file path must not already exist, so a rerun never clobbers a prior snapshot. A failed backup never mutates the source and exits non-zero.
- `node dist/ops/restore.js <snapshot-file> --to <target-db> [--force]` — validates the snapshot (`PRAGMA integrity_check`) before touching anything, writes to a staging file beside the target and atomically renames it into place, and refuses to overwrite an existing target without `--force`. A failed restore leaves the previous database and the snapshot untouched and exits non-zero.

Run the commands inside the backend container over the SSH seam:

```sh
# Backup (safe while the backend is live)
cd /opt/lush-guesser/<dev|prod>
docker compose exec backend node dist/ops/backup.js /app/data
docker compose cp "backend:/app/data/leaderboard-<timestamp>.sqlite" /somewhere/outside/the/release-tree/

# Restore (stop the backend first so nothing writes mid-replace)
docker compose stop backend
docker compose cp snapshot.sqlite "backend:/app/data/restore-in.sqlite"
docker compose run --rm backend node dist/ops/restore.js \
  /app/data/restore-in.sqlite --to /app/data/database.sqlite --force
docker compose start backend
curl -fsS "https://lush-<dev|prod>.lookmaimanengineer.cc/api/leaderboard?limit=20"
```

Keep snapshots in deployment-owned storage outside the release tree (checkout, image, and Git state can all be replaced at will). Restores require an explicit `--to` target; `--force` is the only path that replaces an existing database file.

`scripts/check-backup-restore.sh` proves the full round trip repeatably in a throwaway deployment: representative entries (distinct scores, a score tie with distinct creation timestamps, a repeated name), backup, volume wipe, clean deploy, restore, and byte-exact Leaderboard comparison through the API — including ranking order. Run it before relying on a backup or after changing storage code.
