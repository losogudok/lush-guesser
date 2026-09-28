#!/usr/bin/env bash

set -Eeuo pipefail

: "${DEPLOY_PATH:?DEPLOY_PATH is required}"
: "${COMPOSE_PROJECT_NAME:?COMPOSE_PROJECT_NAME is required}"
: "${FRONTEND_SOCKET_DIR:?FRONTEND_SOCKET_DIR is required}"
: "${LEADERBOARD_VOLUME_NAME:?LEADERBOARD_VOLUME_NAME is required}"

cd "$DEPLOY_PATH"

previous_sha_file=.deploy/previous-sha
if [ ! -s "$previous_sha_file" ]; then
  echo "Recovery failed: no previous deployment SHA is available for rollback." >&2
  exit 1
fi

failed_sha=$(git rev-parse HEAD)
previous_sha=$(cat "$previous_sha_file")
if [ "$failed_sha" = "$previous_sha" ]; then
  echo "Recovery failed: previous deployment SHA is the current SHA; refusing a no-op rollback." >&2
  exit 1
fi

echo "Recovery attempt: rolling $COMPOSE_PROJECT_NAME back from $failed_sha to $previous_sha."

git checkout --force "$previous_sha"
git reset --hard "$previous_sha"

socket_path="$FRONTEND_SOCKET_DIR/frontend.sock"
docker compose config --quiet
docker compose build
docker compose stop frontend >/dev/null 2>&1 || true
rm -f "$socket_path"

# The recovered revision must pass the same readiness gate as a fresh
# release before it may be reported as restored (issue #7).
if ./scripts/compose-up-with-diagnostics.sh && ./scripts/release-readiness.sh; then
  printf '%s\n' "$failed_sha" > .deploy/rolled-back-from
  printf '%s\n' "$previous_sha" > .deploy/deployed-sha
  echo "Recovery succeeded: release $previous_sha passed readiness: backend container health, database migrations, public game delivery, public Leaderboard routing."
  echo "Rolled back $COMPOSE_PROJECT_NAME from $failed_sha to $previous_sha."
  exit 0
fi

echo "Recovery failed: release $previous_sha did not pass readiness; $COMPOSE_PROJECT_NAME remains unrecovered on $previous_sha." >&2
exit 1
