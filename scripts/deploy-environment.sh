#!/usr/bin/env bash

set -Eeuo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${COMPOSE_PROJECT_NAME:?COMPOSE_PROJECT_NAME is required}"
: "${FRONTEND_SOCKET_DIR:?FRONTEND_SOCKET_DIR is required}"
: "${LEADERBOARD_VOLUME_NAME:?LEADERBOARD_VOLUME_NAME is required}"

socket_path="$FRONTEND_SOCKET_DIR/frontend.sock"

wait_for_stack() {
  local _

  for _ in {1..30}; do
    if [ -S "$socket_path" ] && \
      curl --fail --silent --show-error --unix-socket "$socket_path" http://localhost/ >/dev/null && \
      curl --fail --silent --show-error --unix-socket "$socket_path" \
        'http://localhost/api/leaderboard?limit=1' >/dev/null; then
      return 0
    fi
    sleep 2
  done

  docker compose ps
  docker compose logs --tail=200
  return 1
}

cd "$DEPLOY_PATH"

install -d -m 0755 "$FRONTEND_SOCKET_DIR" .deploy

# One-time migration from the original bind-mounted SQLite database.
if [ -s data/database.sqlite ]; then
  docker volume create "$LEADERBOARD_VOLUME_NAME" >/dev/null
  if ! docker run --rm -v "$LEADERBOARD_VOLUME_NAME:/target" \
    alpine:3.21 test -f /target/database.sqlite; then
    docker compose stop backend
    docker run --rm \
      -v "$DEPLOY_PATH/data/database.sqlite:/source/database.sqlite:ro" \
      -v "$LEADERBOARD_VOLUME_NAME:/target" \
      alpine:3.21 cp /source/database.sqlite /target/database.sqlite
  fi
fi

docker compose config --quiet
docker compose build
docker compose stop frontend >/dev/null 2>&1 || true
rm -f "$socket_path"
docker compose up -d --remove-orphans
wait_for_stack

git rev-parse HEAD > .deploy/deployed-sha
echo "Deployed $(cat .deploy/deployed-sha) as $COMPOSE_PROJECT_NAME."
