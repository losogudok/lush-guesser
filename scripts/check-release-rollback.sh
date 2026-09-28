#!/usr/bin/env bash

# Repeatable failure-injection exercise for release recovery (#7).
#
# Runs against a throwaway deployment built from a synthetic git history:
#
#   rev1  good release (passes the readiness gate)
#   rev2  broken backend startup (unusable database path inside /proc)
#   rev3  broken differently, so a rollback target can also fail
#
# Scenario A - successful recovery:
#   deploy rev1, submit a Leaderboard Entry, record the previous revision,
#   deploy rev2 (must fail), then run the rollback. The recovered revision
#   must pass the same readiness gate and the entry must still be served
#   from the untouched deployment-owned volume.
#
# Scenario B - terminal failure:
#   with rev2 as the rollback target, recovery must fail, be reported as
#   unrecovered, and leave the recorded revisions untouched.
#
# Scenario C - no previous revision: recovery must refuse to run.
#
# The exercise asserts that logs distinguish the original deployment
# failure, the recovery attempt, and the final state.

set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

project_name="lush-guesser-release-rollback-${GITHUB_RUN_ID:-local}-$$"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/lush-guesser-release-rollback.XXXXXX")"

cleanup() {
  docker compose down --volumes --remove-orphans >/dev/null 2>&1 || true
  rm -rf "$work_dir"
}
trap cleanup EXIT

export COMPOSE_PROJECT_NAME="$project_name"
export FRONTEND_SOCKET_DIR="$work_dir/socket"
export LEADERBOARD_VOLUME_NAME="${project_name}-data"
export DEPLOY_PATH="$work_dir/deploy"
# Keep the exercise quick while still bounded.
export READINESS_ATTEMPTS=15
export READINESS_INTERVAL=2

deploy_path="$DEPLOY_PATH"
entry_name="Recovery-$$"
compose() {
  docker compose -f "$deploy_path/docker-compose.yml" "$@"
}

expect_failure() {
  local label="$1" log_file="$2" pattern="$3"

  if grep -q "$pattern" "$log_file"; then
    return 0
  fi
  echo "FAIL ($label): expected '$pattern' in the log." >&2
  cat "$log_file" >&2
  exit 1
}

run_script() {
  local log_file="$1"
  shift
  set +e
  (cd "$deploy_path" && "$@") >"$log_file" 2>&1
  local status=$?
  set -e
  return "$status"
}

assert_deployed_sha() {
  local expected="$1" label="$2"
  local actual
  actual=$(cat "$deploy_path/.deploy/deployed-sha" 2>/dev/null || true)
  if [ "$actual" != "$expected" ]; then
    echo "FAIL ($label): .deploy/deployed-sha is '$actual', expected '$expected'." >&2
    exit 1
  fi
}

assert_entry_served() {
  if ! compose exec -T -e ENTRY_NAME="$entry_name" backend node -e '
    fetch("http://127.0.0.1:3001/api/leaderboard?limit=20")
      .then(async (response) => {
        if (!response.ok) throw new Error(`GET failed with ${response.status}`);
        const entries = await response.json();
        const found = entries.some(
          (entry) =>
            entry.name === process.env.ENTRY_NAME && entry.score === 777,
        );
        if (!found) throw new Error("Leaderboard Entry was lost during recovery");
      })
      .catch((error) => {
        console.error(error.message);
        process.exit(1);
      });
  ' >/dev/null 2>&1; then
    echo "FAIL: the Leaderboard Entry did not survive the recovery exercise." >&2
    exit 1
  fi
}

# --- Synthetic release history -------------------------------------------------

source_dir="$work_dir/source"
mkdir -p "$source_dir/scripts"
cp "$repo_root/docker-compose.yml" "$source_dir/"
cp "$repo_root/scripts/deploy-environment.sh" \
  "$repo_root/scripts/rollback-environment.sh" \
  "$repo_root/scripts/compose-up-with-diagnostics.sh" \
  "$repo_root/scripts/release-readiness.sh" \
  "$source_dir/scripts/"
tar -c --exclude=node_modules --exclude=dist -f - server frontend | tar -xf - -C "$source_dir"

git -C "$source_dir" init -q
git -C "$source_dir" config user.email "release-check@example.invalid"
git -C "$source_dir" config user.name "Release Check"
git -C "$source_dir" add -A
git -C "$source_dir" commit -qm "good release"
good_rev=$(git -C "$source_dir" rev-parse HEAD)

# rev2: backend startup broken by an unusable database path. /proc always
# exists but never accepts a new database file, and TypeORM creates missing
# parent directories, so a merely missing path would not break startup.
sed -e 's#- TELEGRAM_BOT_PROXY_URL=${TELEGRAM_BOT_PROXY_URL:-}#&\n      - DATABASE_PATH=/proc/database.sqlite#' \
  "$source_dir/docker-compose.yml" > "$work_dir/compose-rev2.yml"
cp "$work_dir/compose-rev2.yml" "$source_dir/docker-compose.yml"
git -C "$source_dir" commit -qam "broken release 2"
broken_rev=$(git -C "$source_dir" rev-parse HEAD)

# rev3: broken differently, so a rollback target can fail as well.
sed -e 's#- TELEGRAM_BOT_PROXY_URL=${TELEGRAM_BOT_PROXY_URL:-}#&\n      - DATABASE_PATH=/sys/database.sqlite#' \
  "$source_dir/docker-compose.yml" > "$work_dir/compose-rev3.yml"
cp "$work_dir/compose-rev3.yml" "$source_dir/docker-compose.yml"
git -C "$source_dir" commit -qam "broken release 3"
broken_rev2=$(git -C "$source_dir" rev-parse HEAD)

git clone -q "$source_dir" "$deploy_path"
# Clone HEAD is the latest (broken) revision; start from the good one.
git -C "$deploy_path" checkout -q --force "$good_rev"

# --- Scenario A: failed readiness, then successful recovery --------------------

echo "=== Deploying the known-good revision ==="
if ! run_script "$work_dir/deploy-good.log" ./scripts/deploy-environment.sh; then
  echo "FAIL: the known-good revision did not deploy successfully." >&2
  cat "$work_dir/deploy-good.log" >&2
  exit 1
fi
assert_deployed_sha "$good_rev" "known-good deploy"

compose up -d --build backend >/dev/null 2>&1
compose exec -T -e ENTRY_NAME="$entry_name" backend node -e '
  fetch("http://127.0.0.1:3001/api/leaderboard", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: process.env.ENTRY_NAME, score: 777 }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`POST failed with ${response.status}`);
    })
    .catch((error) => {
      console.error(error.message);
      process.exit(1);
    });
'

# Replicate the workflow: record the previous known-good revision before
# the next update attempt.
cp "$deploy_path/.deploy/deployed-sha" "$deploy_path/.deploy/previous-sha"

echo "=== Deploying the broken revision (expected to fail) ==="
git -C "$deploy_path" checkout -q --force "$broken_rev"
run_script "$work_dir/deploy-broken.log" ./scripts/deploy-environment.sh && {
  echo "FAIL: the broken revision deployed successfully." >&2
  cat "$work_dir/deploy-broken.log" >&2
  exit 1
}
assert_deployed_sha "$good_rev" "failed deploy"
expect_failure "original deployment failure" "$work_dir/deploy-broken.log" \
  "Release readiness failed at stage: backend container health\|docker compose up failed"

echo "=== Recovering the previous release ==="
run_script "$work_dir/rollback.log" ./scripts/rollback-environment.sh || {
  echo "FAIL: recovery of the previous release failed." >&2
  cat "$work_dir/rollback.log" >&2
  exit 1
}
assert_deployed_sha "$good_rev" "recovery"
if [ "$(cat "$deploy_path/.deploy/rolled-back-from")" != "$broken_rev" ]; then
  echo "FAIL: .deploy/rolled-back-from does not record the failed revision." >&2
  exit 1
fi
expect_failure "recovery attempt" "$work_dir/rollback.log" "Recovery attempt: rolling"
expect_failure "recovered state" "$work_dir/rollback.log" "Recovery succeeded:"
assert_entry_served
echo "Scenario A passed: the previous release was recovered and the Leaderboard Entry survived."

# --- Scenario B: a rollback target that also fails stays unrecovered ----------

echo "=== Terminal failure: both current and previous revisions broken ==="
git -C "$deploy_path" checkout -q --force "$broken_rev2"
printf '%s\n' "$broken_rev" > "$deploy_path/.deploy/previous-sha"
run_script "$work_dir/rollback-terminal.log" ./scripts/rollback-environment.sh && {
  echo "FAIL: recovery reported success although the rollback target is broken." >&2
  cat "$work_dir/rollback-terminal.log" >&2
  exit 1
}
assert_deployed_sha "$good_rev" "terminal failure"
if [ "$(cat "$deploy_path/.deploy/rolled-back-from")" != "$broken_rev" ]; then
  echo "FAIL: the terminal failure must not update .deploy/rolled-back-from." >&2
  exit 1
fi
expect_failure "unrecovered state" "$work_dir/rollback-terminal.log" "Recovery failed:"
echo "Scenario B passed: a failing recovery is reported as unrecovered."

# --- Scenario C: no previous revision refuses to roll back ---------------------

echo "=== No previous revision ==="
rm -f "$deploy_path/.deploy/previous-sha"
run_script "$work_dir/rollback-no-previous.log" ./scripts/rollback-environment.sh && {
  echo "FAIL: rollback ran without a recorded previous revision." >&2
  cat "$work_dir/rollback-no-previous.log" >&2
  exit 1
}
expect_failure "no previous revision" "$work_dir/rollback-no-previous.log" \
  "no previous deployment SHA is available"
echo "Scenario C passed: rollback refuses to run without a recorded previous revision."

echo "Failure-injection exercise passed: recovery and terminal failure paths behave as specified."
