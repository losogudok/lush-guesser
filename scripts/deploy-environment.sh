#!/usr/bin/env bash

set -Eeuo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${COMPOSE_PROJECT_NAME:?COMPOSE_PROJECT_NAME is required}"
: "${FRONTEND_SOCKET_DIR:?FRONTEND_SOCKET_DIR is required}"
: "${LEADERBOARD_VOLUME_NAME:?LEADERBOARD_VOLUME_NAME is required}"

socket_path="$FRONTEND_SOCKET_DIR/frontend.sock"

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
./scripts/compose-up-with-diagnostics.sh
# The release only counts as successful after the readiness gate observed
# container health, completed migrations, public game delivery, and public
# Leaderboard routing (issue #6).
./scripts/release-readiness.sh

git rev-parse HEAD > .deploy/deployed-sha
deployed_revision=$(cat .deploy/deployed-sha)
echo "Release $deployed_revision passed readiness: backend container health, database migrations, public game delivery, public Leaderboard routing."
echo "Deployed $deployed_revision as $COMPOSE_PROJECT_NAME."
