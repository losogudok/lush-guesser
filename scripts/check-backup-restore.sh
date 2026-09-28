#!/usr/bin/env bash

# Repeatable integration check for Leaderboard Entry backup and restore (#3).
#
# Starts a throwaway deployment, submits representative entries (with score
# ties), takes a snapshot with dist/ops/backup.js, copies it out of the
# volume, wipes the deployment, and restores into a clean deployment with
# dist/ops/restore.js. The API must then serve the exact same entries,
# including ranking order and creation timestamps.
#
# Telegram placeholders keep the check hermetic: the backend runs without
# Telegram so the check never touches a real bot or a proxy.

set -Eeuo pipefail

project_name="lush-guesser-backup-restore-${GITHUB_RUN_ID:-local}-$$"
export COMPOSE_PROJECT_NAME="$project_name"
export BACKEND_CONTAINER_NAME="${project_name}-backend"
export BACKEND_HOST_PORT=0
export LEADERBOARD_VOLUME_NAME="${project_name}-data"
export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
export TELEGRAM_BOT_PROXY_URL="${TELEGRAM_BOT_PROXY_URL:-}"
export TELEGRAM_WEBHOOK_SECRET="${TELEGRAM_WEBHOOK_SECRET:-}"
export TELEGRAM_MINI_APP_URL="${TELEGRAM_MINI_APP_URL:-}"

snapshot_name="leaderboard-${project_name}.sqlite"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/lush-guesser-backup-restore.XXXXXX")"
trap 'rm -rf "$work_dir"' EXIT

cleanup() {
  docker compose down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

wait_for_backend() {
  local attempt
  for attempt in {1..30}; do
    if docker compose exec -T backend node -e '
      fetch("http://127.0.0.1:3001/api/leaderboard?limit=1")
        .then((response) => process.exit(response.ok ? 0 : 1))
        .catch(() => process.exit(1));
    ' >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  docker compose logs backend
  return 1
}

assert_leaderboard_json() {
  local expected="$1"
  docker compose exec -T -e EXPECTED="$expected" backend node -e '
    fetch("http://127.0.0.1:3001/api/leaderboard?limit=20")
      .then(async (response) => {
        if (!response.ok) throw new Error(`GET failed with ${response.status}`);
        const actual = await response.json();
        const expected = JSON.parse(process.env.EXPECTED);
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(
            `Leaderboard mismatch.\nExpected: ${JSON.stringify(expected)}\nActual:   ${JSON.stringify(actual)}`,
          );
        }
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  '
}

docker compose up -d --build backend
wait_for_backend

# Representative entries: distinct scores, a score tie with distinct
# createdAt values (Vanilla/Oakmoss), and a same-name pair.
submit_entry() {
  local name="$1"
  local score="$2"
  docker compose exec -T -e ENTRY_NAME="$name" -e ENTRY_SCORE="$score" backend node -e '
    fetch("http://127.0.0.1:3001/api/leaderboard", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: process.env.ENTRY_NAME,
        score: Number(process.env.ENTRY_SCORE),
      }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`POST failed with ${response.status}`);
        const entry = await response.json();
        if (entry.name !== process.env.ENTRY_NAME || entry.score !== Number(process.env.ENTRY_SCORE)) {
          throw new Error(`Unexpected Leaderboard Entry: ${JSON.stringify(entry)}`);
        }
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  '
}
submit_entry "Bergamot" 950
submit_entry "Oakmoss" 1200
submit_entry "Vanilla" 1200
submit_entry "Sandalwood" 300
submit_entry "Bergamot" 500

baseline="$(docker compose exec -T backend node -e '
  fetch("http://127.0.0.1:3001/api/leaderboard?limit=20")
    .then(async (response) => {
      if (!response.ok) throw new Error(`GET failed with ${response.status}`);
      process.stdout.write(JSON.stringify(await response.json()));
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
')"

echo "Baseline entries: $baseline"

# Backup inside the container, from deployment-owned storage.
docker compose exec -T backend node dist/ops/backup.js /app/data
snapshot_path="/app/data/$(docker compose exec -T backend ls /app/data | grep '^leaderboard-' | tr -d '\r')"
docker compose exec -T backend test -s "$snapshot_path"
echo "Snapshot created inside the volume: $snapshot_path"

# Copy the snapshot out of the deployment volume.
docker compose cp "backend:$snapshot_path" "$work_dir/snapshot.sqlite"
test -s "$work_dir/snapshot.sqlite"

# Wipe the deployment, volume included.
docker compose down --volumes --remove-orphans >/dev/null

# Clean-deploy and confirm the fresh store is empty.
docker compose up -d --build backend
wait_for_backend
assert_leaderboard_json '[]'

# Restore into the clean deployment: stop the backend, place the snapshot
# in the volume, restore with an explicit --to and --force, start again.
docker compose stop backend
docker compose cp "$work_dir/snapshot.sqlite" "backend:$snapshot_path"
docker compose run --rm backend node dist/ops/restore.js \
  "$snapshot_path" --to /app/data/database.sqlite --force
docker compose start backend
wait_for_backend

assert_leaderboard_json "$baseline"

echo "Backup/restore round trip reproduced the exact Leaderboard Entries."
