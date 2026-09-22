#!/usr/bin/env bash

set -Eeuo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${COMPOSE_PROJECT_NAME:?COMPOSE_PROJECT_NAME is required}"
: "${FRONTEND_SOCKET_DIR:?FRONTEND_SOCKET_DIR is required}"
: "${LEADERBOARD_VOLUME_NAME:?LEADERBOARD_VOLUME_NAME is required}"

cd "$DEPLOY_PATH"

previous_sha_file=.deploy/previous-sha
if [ ! -s "$previous_sha_file" ]; then
  echo "No previous deployment SHA is available for rollback." >&2
  exit 1
fi

failed_sha=$(git rev-parse HEAD)
previous_sha=$(cat "$previous_sha_file")
if [ "$failed_sha" = "$previous_sha" ]; then
  echo "Previous deployment SHA is the current SHA; refusing a no-op rollback." >&2
  exit 1
fi

git checkout --force "$previous_sha"
git reset --hard "$previous_sha"

socket_path="$FRONTEND_SOCKET_DIR/frontend.sock"
docker compose config --quiet
docker compose build
docker compose stop frontend >/dev/null 2>&1 || true
rm -f "$socket_path"
docker compose up -d --remove-orphans

for _ in {1..30}; do
  if [ -S "$socket_path" ] && \
    curl --fail --silent --show-error --unix-socket "$socket_path" http://localhost/ >/dev/null && \
    curl --fail --silent --show-error --unix-socket "$socket_path" \
      --output /dev/null --write-out '%{content_type}' \
      'http://localhost/api/leaderboard?limit=1' | grep -qi '^application/json'; then
    printf '%s\n' "$failed_sha" > .deploy/rolled-back-from
    printf '%s\n' "$previous_sha" > .deploy/deployed-sha
    echo "Rolled back $COMPOSE_PROJECT_NAME from $failed_sha to $previous_sha."
    exit 0
  fi
  sleep 2
done

docker compose ps
docker compose logs --tail=200
echo "Rollback to $previous_sha did not become healthy." >&2
exit 1
