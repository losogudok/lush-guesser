#!/usr/bin/env bash

# Repeatable failure-injection check for the release readiness gate (#6).
#
# Proves that starting containers is not reported as a successful release.
# Both scenarios run in a throwaway deployment built from the real deploy
# scripts:
#
#   1. Migrations deliberately incomplete: the migration ledger is
#      pre-marked as applied but the catalog tables are missing, so the
#      backend boots and its healthcheck passes while the database is
#      still not ready. The release must fail at the migration stage even
#      though the container is healthy.
#   2. Startup failure: DATABASE_PATH points inside /proc, where SQLite
#      can never create a file, so the backend never becomes ready. The
#      release must fail with actionable diagnostics and never record a
#      deployed revision.
#
# All readiness observations are read-only and repeatable.

set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

project_name="lush-guesser-release-failure-${GITHUB_RUN_ID:-local}-$$"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/lush-guesser-release-failure.XXXXXX")"

cleanup() {
  docker compose down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$work_dir"
}
trap cleanup EXIT

export COMPOSE_PROJECT_NAME="$project_name"
export FRONTEND_SOCKET_DIR="$work_dir/socket"
export LEADERBOARD_VOLUME_NAME="${project_name}-data"
export DEPLOY_PATH="$work_dir/deploy"
# Keep the failure paths quick while still bounded.
export READINESS_ATTEMPTS=15
export READINESS_INTERVAL=2

deploy_path="$DEPLOY_PATH"
mkdir -p "$deploy_path/scripts" "$FRONTEND_SOCKET_DIR"
cp "$repo_root/docker-compose.yml" "$deploy_path/"
cp "$repo_root/scripts/deploy-environment.sh" \
  "$repo_root/scripts/compose-up-with-diagnostics.sh" \
  "$repo_root/scripts/release-readiness.sh" \
  "$deploy_path/scripts/"
tar -c --exclude=node_modules --exclude=dist -f - server frontend | tar -xf - -C "$deploy_path"
# The deploy records the revision with git, as it does in a real checkout.
git -C "$deploy_path" init -q
git -C "$deploy_path" config user.email "release-check@example.invalid"
git -C "$deploy_path" config user.name "Release Check"
git -C "$deploy_path" add -A
git -C "$deploy_path" commit -qm "release under test"

expect_release_failed() {
  local label="$1" log_file="$2"

  if [ -s "$deploy_path/.deploy/deployed-sha" ]; then
    echo "FAIL ($label): release reported success by writing .deploy/deployed-sha." >&2
    exit 1
  fi
  if ! grep -q "Release readiness failed at stage\|docker compose up failed" "$log_file"; then
    echo "FAIL ($label): no actionable failure diagnostic was reported." >&2
    cat "$log_file" >&2
    exit 1
  fi
}

run_deploy() {
  local log_file="$1"
  set +e
  (cd "$deploy_path" && ./scripts/deploy-environment.sh) >"$log_file" 2>&1
  local status=$?
  set -e
  return "$status"
}

echo "=== Scenario 1: backend healthy but migrations incomplete ==="
docker compose -f "$deploy_path/docker-compose.yml" build backend >/dev/null 2>&1
# Pre-mark every migration as applied while only creating the leaderboard
# table, so the backend boots healthy but the catalog schema is missing.
docker compose -f "$deploy_path/docker-compose.yml" \
  run --rm backend node -e '
    const Database = require("better-sqlite3");
    const db = new Database(process.env.DATABASE_PATH);
    db.exec(
      "CREATE TABLE IF NOT EXISTS migrations " +
        "(id integer PRIMARY KEY, timestamp integer NOT NULL, name varchar NOT NULL)",
    );
    const insert = db.prepare("INSERT INTO migrations (timestamp, name) VALUES (?, ?)");
    insert.run(1710000000000, "CreateLeaderboard1710000000000");
    insert.run(1710000001000, "CreateCatalog1710000001000");
    const q = String.fromCharCode(39);
    db.exec(
      "CREATE TABLE IF NOT EXISTS leaderboard " +
        "(id integer PRIMARY KEY AUTOINCREMENT NOT NULL, name varchar NOT NULL, " +
        "score integer NOT NULL, createdAt datetime NOT NULL DEFAULT (datetime(" +
        q + "now" + q + ")))",
    );
    db.close();
  '

scenario1_log="$work_dir/scenario1.log"
if run_deploy "$scenario1_log"; then
  echo "FAIL (scenario 1): release succeeded although migrations were incomplete." >&2
  cat "$scenario1_log" >&2
  exit 1
fi
if ! grep -q "Readiness check passed: backend container health" "$scenario1_log"; then
  echo "FAIL (scenario 1): backend container was expected to become healthy first." >&2
  cat "$scenario1_log" >&2
  exit 1
fi
if ! grep -q "Release readiness failed at stage: database migrations" "$scenario1_log"; then
  echo "FAIL (scenario 1): release did not fail at the database migrations stage." >&2
  cat "$scenario1_log" >&2
  exit 1
fi
expect_release_failed "scenario 1" "$scenario1_log"
echo "Scenario 1 passed: healthy container with incomplete migrations is not reported as success."

echo "=== Scenario 2: startup failure ==="
docker compose -f "$deploy_path/docker-compose.yml" \
  down --volumes --remove-orphans >/dev/null 2>&1 || true
# /proc is inside the container, always exists, and never accepts a new
# database file, so the backend cannot open its store and never becomes
# ready (TypeORM creates missing parent directories, so a merely missing
# path is not enough to break startup).
cat > "$deploy_path/docker-compose.override.yml" <<'EOF'
services:
  backend:
    environment:
      - DATABASE_PATH=/proc/database.sqlite
EOF

scenario2_log="$work_dir/scenario2.log"
if run_deploy "$scenario2_log"; then
  echo "FAIL (scenario 2): release succeeded although the backend cannot start." >&2
  cat "$scenario2_log" >&2
  exit 1
fi
expect_release_failed "scenario 2" "$scenario2_log"
echo "Scenario 2 passed: startup failure fails the release with diagnostics."

echo "Failure-injection check passed: container start without readiness is never reported as a successful release."
