#!/usr/bin/env bash

# Production readiness gate shared by deploy-environment.sh and
# rollback-environment.sh (#6, #7).
#
# A release succeeds only after every stage below has been observed through
# the production adapter within a bounded timeout:
#
#   1. backend container health   - the Docker healthcheck reports healthy
#   2. database migrations        - the migration ledger and all expected
#                                   tables exist (read-only observation)
#   3. public game delivery       - the frontend socket serves the game HTML
#   4. public Leaderboard routing - a non-mutating GET returns Leaderboard
#                                   JSON through the same socket
#
# All checks are repeatable: they only GET public routes and read the
# database read-only, so they never create Leaderboard Entries or mutate
# Player data. On failure the failing stage is named and diagnostics are
# collected before a non-zero exit.

set -Eeuo pipefail

: "${COMPOSE_PROJECT_NAME:?COMPOSE_PROJECT_NAME is required}"
: "${FRONTEND_SOCKET_DIR:?FRONTEND_SOCKET_DIR is required}"

socket_path="$FRONTEND_SOCKET_DIR/frontend.sock"

# Bounded wait: READINESS_ATTEMPTS x READINESS_INTERVAL seconds per stage.
attempts="${READINESS_ATTEMPTS:-60}"
interval="${READINESS_INTERVAL:-2}"

# Keep in sync with server/src/database.ts and server/src/migrations.
expected_migrations="CreateLeaderboard1710000000000,CreateCatalog1710000001000"
expected_tables="leaderboard,ingredient,product,product_ingredient_clue"

collect_diagnostics() {
  echo "Readiness diagnostics for $COMPOSE_PROJECT_NAME:" >&2
  docker compose ps --all >&2 || true
  docker compose logs --no-color --timestamps --tail=100 backend frontend 2>&1 \
    | sed -E \
      -e 's#(/bot)[0-9]+:[A-Za-z0-9_-]+#\1<REDACTED>#g' \
      -e 's#(socks5h?://)[^/@[:space:]]+@#\1<REDACTED>@#g' \
      -e 's#(TELEGRAM_(BOT_TOKEN|WEBHOOK_SECRET|BOT_PROXY_URL)[=:][[:space:]]*)[^[:space:]]+#\1<REDACTED>#g' \
    >&2 || true
}

run_stage() {
  local stage="$1"

  echo "Readiness: waiting for $stage (up to $((attempts * interval))s)..."
  if "$2"; then
    echo "Readiness check passed: $stage."
    return 0
  fi
  echo "Release readiness failed at stage: $stage." >&2
  collect_diagnostics
  return 1
}

wait_backend_container_healthy() {
  local attempt container_id status

  for attempt in $(seq "$attempts"); do
    container_id=$(docker compose ps --all --quiet backend 2>/dev/null || true)
    if [ -n "$container_id" ]; then
      status=$(docker inspect --format \
        '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
        "$container_id" 2>/dev/null || true)
      if [ "$status" = "healthy" ]; then
        return 0
      fi
    fi
    sleep "$interval"
  done

  echo "Backend container did not become healthy within the readiness timeout." >&2
  return 1
}

verify_migrations() {
  local attempt

  for attempt in $(seq "$attempts"); do
    if docker compose exec -T \
      -e EXPECTED_MIGRATIONS="$expected_migrations" \
      -e EXPECTED_TABLES="$expected_tables" \
      backend node -e '
        const Database = require("better-sqlite3");
        const expectedMigrations = process.env.EXPECTED_MIGRATIONS.split(",");
        const expectedTables = process.env.EXPECTED_TABLES.split(",");
        const db = new Database(process.env.DATABASE_PATH, { readonly: true });
        const applied = new Set(
          db.prepare("SELECT name FROM migrations").all().map((row) => row.name),
        );
        const tables = new Set(
          db.prepare("SELECT name FROM sqlite_master WHERE type = ?").all("table").map((row) => row.name),
        );
        db.close();
        const missingMigrations = expectedMigrations.filter((name) => !applied.has(name));
        const missingTables = expectedTables.filter((name) => !tables.has(name));
        if (missingMigrations.length > 0 || missingTables.length > 0) {
          console.error(
            "Incomplete database initialization; missing migrations: " +
              JSON.stringify(missingMigrations) +
              "; missing tables: " +
              JSON.stringify(missingTables),
          );
          process.exit(1);
        }
      ' >/dev/null 2>&1
    then
      return 0
    fi
    sleep "$interval"
  done

  echo "Database initialization or migrations did not complete within the readiness timeout." >&2
  return 1
}

wait_public_delivery() {
  local attempt

  for attempt in $(seq "$attempts"); do
    if [ -S "$socket_path" ] && \
      curl --fail --silent --show-error --unix-socket "$socket_path" http://localhost/ \
        | grep -qi 'Lush Scent Guesser' && \
      curl --fail --silent --show-error --unix-socket "$socket_path" \
        --output /dev/null --write-out '%{content_type}' \
        'http://localhost/api/leaderboard?limit=1' | grep -qi '^application/json'
    then
      return 0
    fi
    sleep "$interval"
  done

  echo "Public game delivery or public Leaderboard routing did not become ready within the readiness timeout." >&2
  return 1
}

main() {
  run_stage "backend container health" wait_backend_container_healthy || return 1
  run_stage "database migrations" verify_migrations || return 1
  run_stage "public game delivery and Leaderboard routing" wait_public_delivery || return 1
  echo "Release readiness passed: backend container health, database migrations, public game delivery, public Leaderboard routing."
}

main "$@"
