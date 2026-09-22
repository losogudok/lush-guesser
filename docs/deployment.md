# Deployment

GitHub Actions deploys the `dev` branch to the development environment and the `main` branch to production after all deterministic checks and the production-image build pass. Production changes must arrive through a pull request from `dev` to `main`.

## Environment layout

| Setting | Development | Production |
| --- | --- | --- |
| GitHub Environment | `development` | `production` |
| URL | `https://lush-dev.lookmaimanengineer.cc` | `https://lush.lookmaimanengineer.cc` |
| Checkout | `/opt/lush-guesser/dev` | `/opt/lush-guesser/prod` |
| Compose project | `lush-guesser-dev` | `lush-guesser-prod` |
| Frontend socket directory | `/run/lush-guesser/dev` | `/run/lush-guesser/prod` |
| Leaderboard volume | `lush-guesser-dev-data` | `lush-guesser-prod-data` |

Both environments run production images. They share one Docker host and are therefore operationally separated, not security-isolated.

## GitHub configuration

Configure these repository secrets:

- `DEPLOY_HOST`: `89.250.2.153`, the public address that forwards to `192.168.0.9`
- `DEPLOY_USER`: `root`
- `DEPLOY_PORT`: `56943`, forwarded to port 22 on the server
- `DEPLOY_SSH_KEY`: the private key authorized for the deployment account; configure this manually and never commit it

GitHub-hosted runners cannot reach the private `192.168.0.9` address directly. Do not replace the public `DEPLOY_HOST` with the LAN address.

Configure these variables on each GitHub Environment:

| Variable | Development | Production |
| --- | --- | --- |
| `DEPLOY_ENABLED` | `false` initially | `false` initially |
| `DEPLOY_URL` | `https://lush-dev.lookmaimanengineer.cc` | `https://lush.lookmaimanengineer.cc` |
| `DEPLOY_PATH` | `/opt/lush-guesser/dev` | `/opt/lush-guesser/prod` |
| `COMPOSE_PROJECT_NAME` | `lush-guesser-dev` | `lush-guesser-prod` |
| `FRONTEND_SOCKET_DIR` | `/run/lush-guesser/dev` | `/run/lush-guesser/prod` |
| `LEADERBOARD_VOLUME_NAME` | `lush-guesser-dev-data` | `lush-guesser-prod-data` |

Leave `DEPLOY_ENABLED=false` until DNS, certificates, Nginx, and the SSH secret are ready. After changing it to `true`, the next push to that environment's branch deploys automatically.

## One-time host provisioning

The server already runs Nginx from `/opt/nginx-selfsteal` as a host-network Docker Compose project. Provision the shared socket directories and proxy configuration only after both certificate files exist:

The current host snapshot contains a legacy `lush.lookmaimanengineer.cc` server block inside `/opt/nginx-selfsteal/conf.d/xhttp.conf`. Back up that file and remove the complete legacy block before installing `lush-guesser.conf`; leaving both definitions would create duplicate virtual hosts.

```bash
install -m 0644 deploy/tmpfiles.d/lush-guesser.conf /etc/tmpfiles.d/lush-guesser.conf
systemd-tmpfiles --create /etc/tmpfiles.d/lush-guesser.conf

install -m 0644 deploy/nginx/docker-compose.override.yml \
  /opt/nginx-selfsteal/docker-compose.override.yml
install -m 0644 deploy/nginx/lush-guesser.conf \
  /opt/nginx-selfsteal/conf.d/lush-guesser.conf
```

The expected certificate paths inside the host checkout are:

```text
/opt/nginx-selfsteal/ssl/lush-dev.lookmaimanengineer.cc/fullchain.crt
/opt/nginx-selfsteal/ssl/lush-dev.lookmaimanengineer.cc/private.key
/opt/nginx-selfsteal/ssl/lush.lookmaimanengineer.cc/fullchain.crt
/opt/nginx-selfsteal/ssl/lush.lookmaimanengineer.cc/private.key
```

Use the server's existing acme.sh TLS-ALPN renewal mechanism to issue and install them. Then validate and recreate Nginx so it receives the socket bind mount:

```bash
cd /opt/nginx-selfsteal
docker compose config --quiet
docker compose run --rm nginx nginx -t
docker compose up -d
docker exec nginx-selfsteal nginx -t
```

## Deployment behavior

Deployments on the shared host are serialized with `/run/lock/lush-guesser-deploy.lock`. Each deployment:

1. records the last successfully deployed commit;
2. fetches and checks out the exact GitHub commit;
3. builds both production images;
4. recreates only that environment's Compose project;
5. checks the frontend and API through its Unix socket;
6. checks the same paths through the public HTTPS URL.

If deployment or public health verification fails, CI checks out the last successfully deployed commit and rebuilds that environment while preserving its Leaderboard Entry volume. Database migrations must remain compatible with the preceding application version for this code-only rollback to be safe.

## Activation checks

Before enabling an environment, all of these commands must succeed:

```bash
getent ahostsv4 lush-dev.lookmaimanengineer.cc
getent ahostsv4 lush.lookmaimanengineer.cc
curl --fail https://lush-dev.lookmaimanengineer.cc/
curl --fail 'https://lush-dev.lookmaimanengineer.cc/api/leaderboard?limit=1'
curl --fail https://lush.lookmaimanengineer.cc/
curl --fail 'https://lush.lookmaimanengineer.cc/api/leaderboard?limit=1'
```
