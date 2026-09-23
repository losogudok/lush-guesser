#!/usr/bin/env bash

set -Eeuo pipefail

project_name="lush-guesser-persistence-${GITHUB_RUN_ID:-local}-$$"
export COMPOSE_PROJECT_NAME="$project_name"
export BACKEND_CONTAINER_NAME="${project_name}-backend"
export BACKEND_HOST_PORT=0
export LEADERBOARD_VOLUME_NAME="${project_name}-data"

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

docker compose up -d --build backend
wait_for_backend

docker compose exec -T backend node -e '
  fetch("http://127.0.0.1:3001/api/leaderboard")
    .then(async (response) => {
      if (!response.ok) throw new Error(`GET failed with ${response.status}`);
      const entries = await response.json();
      if (entries.length !== 0) {
        throw new Error(`Expected an empty migrated store, found ${entries.length} entries`);
      }
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
'

entry_name="Persist-$$"
docker compose exec -T -e PERSISTENCE_ENTRY_NAME="$entry_name" backend node -e '
  fetch("http://127.0.0.1:3001/api/leaderboard", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: process.env.PERSISTENCE_ENTRY_NAME, score: 4242 }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`POST failed with ${response.status}`);
      const entry = await response.json();
      if (entry.name !== process.env.PERSISTENCE_ENTRY_NAME || entry.score !== 4242) {
        throw new Error(`Unexpected Leaderboard Entry: ${JSON.stringify(entry)}`);
      }
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
'

docker compose build backend
docker compose up -d --force-recreate backend
wait_for_backend

docker compose exec -T -e PERSISTENCE_ENTRY_NAME="$entry_name" backend node -e '
  fetch("http://127.0.0.1:3001/api/leaderboard?limit=20")
    .then(async (response) => {
      if (!response.ok) throw new Error(`GET failed with ${response.status}`);
      const entries = await response.json();
      const persisted = entries.some(
        (entry) =>
          entry.name === process.env.PERSISTENCE_ENTRY_NAME && entry.score === 4242,
      );
      if (!persisted) throw new Error("Leaderboard Entry did not survive rebuild/restart");
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
'

echo "Leaderboard Entry survived production rebuild/restart."
