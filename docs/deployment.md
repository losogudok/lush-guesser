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

The backend accepts Telegram updates at `/webhook`. Set these variables in a deployment-owned `.env` file beside the Compose file; keep that file out of version control and restrict it to the deployment account:

| Variable | Purpose |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API credential used to answer inline queries |
| `TELEGRAM_WEBHOOK_SECRET` | Shared secret checked against Telegram's `X-Telegram-Bot-Api-Secret-Token` header |
| `TELEGRAM_MINI_APP_URL` | Public HTTPS URL opened by the inline Mini App button |

The webhook fails closed when its secret is absent or invalid. Inline queries are answered with a Mini App button and no chat message is sent. Leave the Telegram variables unset to keep the integration inactive. Configure Telegram to send `inline_query` updates to `https://lush.lookmaimanengineer.cc/webhook` with the matching webhook secret.
