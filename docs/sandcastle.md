# Sandcastle

This repo uses Sandcastle to run coding agents in isolated Docker sandboxes.

## Setup

1. Install pnpm 12.14.0 and root dependencies:

```bash
npm install --global pnpm@12.14.0
pnpm install --frozen-lockfile
```

Use Node 24 and a running Docker daemon. Sandcastle installs the root, frontend,
and server dependencies inside each sandbox with frozen lockfiles, sharing the
mounted pnpm store. Host `node_modules` directories are not copied into sandboxes.

2. Create a local Sandcastle environment file:

```bash
cp .sandcastle/.env.example .sandcastle/.env
chmod 600 .sandcastle/.env
```

Fill in:

- `OPENCODE_GO_API_KEY` with an active OpenCode Go subscription for the implementer
  (`OPENCODE_API_KEY` is accepted as a legacy fallback)
- `GH_TOKEN` with GitHub Issues read/write access

Run `codex login` on the host and sign in with ChatGPT for subscription access.
Sandcastle reads the login cache from `$CODEX_HOME/auth.json` (default
`~/.codex/auth.json`). Set `SANDCASTLE_CODEX_AUTH_FILE` in your shell to use a
different cache file. The file is mounted read-only, then copied into each
container's private home so Codex can refresh tokens there. Host Codex settings
are not mounted. Credentials are never baked into the image.

3. Build the sandbox image:

```bash
pnpm run sandcastle:build-image
```

The image includes pnpm, OpenCode, Codex CLI, GitHub CLI, native build tools, and Playwright
Chromium with its system libraries. Its Playwright version must match the root
`pnpm-lock.yaml`; update `PLAYWRIGHT_VERSION` in `.sandcastle/Dockerfile` when
upgrading Playwright, then rebuild the image.

4. Verify setup without invoking an AI model or changing GitHub issues:

```bash
pnpm run sandcastle:check
```

This checks credential presence, Docker access, image tooling, Codex's cached
login status, the selected Go model in OpenCode's catalog, GitHub issue read
access using the sandbox token, and an actual Chromium launch as the host UID.
It does not invoke a model or test GitHub issue write permissions. Catalog
visibility and a cached login do not prove live model access or remaining quota.

## Models

Each role has its own provider and model, configured in `.sandcastle/runtime.mts`:

| Role | Provider | Default model | Reasoning effort |
| --- | --- | --- | --- |
| Planner | Codex | `gpt-6.1-sol` | `high` |
| Issue validator | Codex | Same model as planner | `high` |
| Implementer | OpenCode Go | `opencode-go/kimi-k3.1-pro` | Provider default |
| Reviewer | Codex | `gpt-6.1-sol` | `high` |
| Merger | Codex | `gpt-6.1-sol` | `medium` |

Codex uses the host's login cache; OpenCode Go is configured with the Console API
key from `.sandcastle/.env`. The two providers share the issue worktree during
implementation and review, while keeping separate agent sessions.

## Running Agents

Sandcastle selects unassigned GitHub Issues labeled `ready-for-agent`, following
`docs/agents/issue-tracker.md`. The planner must verify that blocking issues are
closed and exclude issues with conflicting triage labels. If every candidate is
blocked, finite runs exit without selecting work; continuous mode waits and checks again.

The runner plans work, implements and reviews each selected issue in a separate
branch, then merges completed branches into the current local branch and closes
their GitHub issues. Start from a clean worktree on the branch where you want the
results. Planning and merging also use temporary worktrees so their dependency
installs do not change the host checkout. It does not push or deploy changes.

Before implementation, a separate validator checks each selected issue against
the current code, existing checks, issue comments, acceptance criteria, and ADRs.
It must provide evidence that the issue is real, still applies, and should be
solved. Bugs need a reproduction or a demonstrated defect; approved features
need a demonstrated missing behavior and clear acceptance criteria.

Uncertainty pauses that issue for a human. Missing facts receive `needs-info`;
an apparently fixed, duplicate, obsolete, or inappropriate request receives
`needs-triage`. The runner removes `ready-for-agent` and posts the evidence and a
focused question as a GitHub issue comment. It leaves the issue open and excludes
its branch from merging. No person is automatically assigned or mentioned.

On retry, the validator uses prior maintainer replies rather than repeating an
answered question. When an OWNER, MEMBER, or COLLABORATOR confirms completion and
the validator independently verifies the agreed acceptance criteria on the starting
base, it returns `already-resolved` with evidence and the confirmation comment URL.
The runner rechecks GitHub eligibility and that comment, closes the issue as
completed with the evidence, and removes `ready-for-agent`. This path needs no new
commits and does not invoke implementation, review, or merging. The zero-commit
guard still applies to issues approved for implementation. New contradictory
evidence can require another human decision; unrelated remaining work stays in
separate issues according to the maintainer's scope decision.

The same handoff is available if doubts arise during implementation or review.
Malformed validation output, validator file changes, agent failures, or missing
completion signals also exclude the branch and request human input. Both coding
and review must explicitly finish before their commits become eligible to merge.
After a human responds, resolve blockers, remove conflicting triage labels, and
restore `ready-for-agent` to retry. Other independent issues can continue.

Already closed, assigned, reclassified, or newly blocked issues are skipped
without changing their GitHub state. Validation and handoff behavior is tested
locally without model inference or real GitHub writes:

```bash
pnpm run sandcastle:test
```

```bash
pnpm run sandcastle
```

## Continuous mode

To keep processing batches and watch for newly ready GitHub issues:

```bash
pnpm run sandcastle:watch
```

This is equivalent to `SANDCASTLE_MAX_ITERATIONS=infinite pnpm run sandcastle`.
It checks GitHub every 60 seconds while idle. To change the interval:

```bash
SANDCASTLE_POLL_INTERVAL_SECONDS=30 pnpm run sandcastle:watch
```

A new issue is picked up after it becomes open, unassigned, and labeled
`ready-for-agent`, without conflicting triage labels. The issue templates start
with `needs-triage`, so creating an issue alone does not authorize implementation:
review it, remove `needs-triage`, and add `ready-for-agent`. The planner and validator
still check dependencies, evidence, and acceptance criteria. Issues awaiting human
input remain paused until a human restores their eligibility.

This uses polling rather than GitHub webhooks. New ready issues are discovered
within the polling interval while idle, or after the current batch finishes.
When the labeled queue is empty, polling uses only a GitHub CLI read and does not
invoke a model. If candidates exist but all are blocked, the planner rechecks them
at the polling interval. Normal successful batches are followed immediately by
another queue check so newly unblocked issues can run.

Stop with Ctrl+C (SIGINT); SIGTERM is also supported. Cancellation propagates to
active agents and does not request clarification or relabel an issue. Temporary
GitHub queue-read failures, including loading issue bodies and comments for the
planner, are retried after the polling delay before creating a sandbox or invoking
a model. Fatal planning or merge failures stop the process for inspection rather
than retrying partial work.
Continuous mode does not automatically push or deploy changes. Keep the process
running in your terminal, or use the user systemd service below.

Commit runner changes before starting, so sandbox worktrees use the same source.

## User systemd service

Install, enable, and start this project's watcher:

```bash
pnpm run sandcastle:service --name lush-guesser --image lush-guesser-sandcastle --start
```

The installer creates a reusable `sandcastle@.service` template, a shared launcher
and installer under `~/.local/libexec/sandcastle/`, and a project configuration at
`~/.config/sandcastle/projects/lush-guesser.env`. It captures the actual Node
executable and sets PATH explicitly, so NVM does not need an interactive shell.
Reinstallation preserves an existing project's settings. Reusing the same
instance name for another directory is rejected.

Common commands:

```bash
systemctl --user status sandcastle@lush-guesser.service
journalctl --user -u sandcastle@lush-guesser.service -f
systemctl --user stop sandcastle@lush-guesser.service
systemctl --user restart sandcastle@lush-guesser.service
systemctl --user disable --now sandcastle@lush-guesser.service
```

The service starts at user login. With user lingering enabled, it also starts at
boot and continues after logout. Check with `loginctl show-user "$USER" -p Linger`;
if needed, enable it with `loginctl enable-linger "$USER"` (system policy may
require administrator privileges).

Each service instance is tied to its configured directory and Git branch. A
branch mismatch stops processing before planning or merging. A lock in the Git
common directory prevents duplicate service instances for the same repository.
Stop the service before running the watcher manually in that repository.

The default service settings are one issue pipeline at a time, a 60-second poll
interval, and two CPUs per Docker sandbox. Edit the project's service environment
file and restart the instance to change these. The CPU limit applies to each
sandbox, not the host's entire Docker workload. Service settings contain paths
and runtime options; credentials stay in the repo's ignored `.sandcastle/.env`
and the host Codex login cache.

Ordinary planner/merge errors leave the service failed for inspection. It restarts
only after abnormal process termination, with a 30-second delay and a limit of
three starts per ten minutes. An explicit stop does not restart it. Boot readiness
is checked by running `.sandcastle/check.mts` before starting the watcher. Temporary
startup failures retry up to 12 times with a five-second delay, within systemd's
180-second startup timeout, allowing Docker and networking time to become ready.
If prerequisites remain unavailable, fix them and restart the service.

## Adding other projects

Use one service instance per repository, preferably with a dedicated checkout and
branch for unattended results. Each repository needs its own `.sandcastle/main.mts`,
`.sandcastle/check.mts`, local dependencies (including `tsx`), ignored credentials,
Docker image, issue tracker/labels, and prompts and verification commands suited
to that codebase. Adapt the install hooks and coding standards to that project.

Once another repository's Sandcastle setup passes its check, register it with the
shared installer from any directory:

```bash
node ~/.local/libexec/sandcastle/install.mjs \
  --name another-project \
  --directory /absolute/path/to/another-project \
  --image another-project-sandcastle \
  --start
```

This creates `sandcastle@another-project.service` and a separate project settings
file. The runner resolves GitHub from that repository's working directory, and
logs, worktrees, and image selection remain per project. Service resource and
branch settings require the corresponding support in that repo's runner.

Start with one pipeline per project. Codex and Go subscription limits are shared
across instances using the same account; separate services do not increase those
allowances. Increase `SANDCASTLE_MAX_PARALLEL_ISSUES` only when the machine and
provider quotas can support the combined workload. Run the source installer again
to update the shared service files, then restart instances to use the new launcher.

Optional environment variables:

- `SANDCASTLE_MAX_ITERATIONS=1` limits plan/execute/merge cycles; `infinite` enables continuous polling
- `SANDCASTLE_POLL_INTERVAL_SECONDS=60` controls the idle/retry delay (1–86400 seconds)
- `SANDCASTLE_MAX_PARALLEL_ISSUES=2` caps the issues selected per batch (1–32); remaining issues are considered in later cycles
- `SANDCASTLE_CONTAINER_CPUS` optionally limits CPUs per Docker sandbox (the service sets `2`)
- `SANDCASTLE_EXPECTED_BRANCH` optionally restricts the branch receiving results (set by the service installer)
- `SANDCASTLE_PLANNER_MODEL=gpt-6.1-sol` overrides the planner's Codex model
- `SANDCASTLE_IMPLEMENTER_MODEL=opencode-go/kimi-k3.1-pro` overrides the Go model
- `SANDCASTLE_REVIEWER_MODEL=gpt-6.1-sol` overrides the reviewer's Codex model
- `SANDCASTLE_MERGER_MODEL=gpt-6.1-sol` overrides the merger's Codex model
- `SANDCASTLE_MODEL` remains a legacy fallback for the implementer only
- `SANDCASTLE_CODEX_AUTH_FILE` overrides the host Codex login cache file
- `SANDCASTLE_IMAGE_NAME=lush-guesser-sandcastle` selects the local Docker image
- `SANDCASTLE_TARGET_BRANCH=main` overrides the reviewer diff base; by default it
  uses the host's HEAD at the start of each batch, resolved before issue branches are created

## Verification Commands

Agents should run this full verification set before committing unless a specific sandbox blocker prevents it:

```bash
pnpm run sandcastle:test
pnpm --dir frontend run test:catalog
pnpm --dir frontend run validate:catalog
pnpm --dir frontend run lint
pnpm --dir frontend run build
pnpm --dir server run lint
pnpm --dir server test --passWithNoTests
pnpm --dir server run test:e2e
pnpm --dir server run build
pnpm run test:e2e
```

`pnpm run test:e2e` at the repo root runs the Playwright smoke test on isolated ports.
Install its browser with `pnpm exec playwright install --with-deps chromium`.
To use an existing Chromium installation locally, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path.

## Operational Notes

- The Docker sandbox image is based on Node 24 to match the app.
- The image installs both `opencode-ai` and `@openai/codex` for the role-specific providers.
- `.sandcastle/.env` is intentionally ignored and must never be committed.
- Agents should use the glossary in `CONTEXT.md` and coding standards in `.sandcastle/CODING_STANDARDS.md`.
