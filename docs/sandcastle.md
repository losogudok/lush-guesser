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

- `OPENCODE_API_KEY` for the default OpenCode agent provider
- `GH_TOKEN` with GitHub Issues read/write access

3. Build the sandbox image:

```bash
pnpm run sandcastle:build-image
```

The image includes pnpm, OpenCode, GitHub CLI, native build tools, and Playwright
Chromium with its system libraries. Its Playwright version must match the root
`pnpm-lock.yaml`; update `PLAYWRIGHT_VERSION` in `.sandcastle/Dockerfile` when
upgrading Playwright, then rebuild the image.

4. Verify setup without invoking an AI model or changing GitHub issues:

```bash
pnpm run sandcastle:check
```

This checks credential presence, Docker access, image tooling, GitHub issue read
access using the sandbox token, and an actual Chromium launch as the host UID.
It does not test model authentication or GitHub issue write permissions.

## Running Agents

Sandcastle selects unassigned GitHub Issues labeled `ready-for-agent`, following
`docs/agents/issue-tracker.md`. The planner must verify that blocking issues are
closed and exclude issues with conflicting triage labels. If every candidate is
blocked, it exits without selecting work.

The runner plans work, implements and reviews each selected issue in a separate
branch, then merges completed branches into the current local branch and closes
their GitHub issues. Start from a clean worktree on the branch where you want the
results. Planning and merging also use temporary worktrees so their dependency
installs do not change the host checkout. It does not push or deploy changes.

```bash
pnpm run sandcastle
```

Optional environment variables:

- `SANDCASTLE_MAX_ITERATIONS=1` controls plan/execute/merge loops
- `SANDCASTLE_MODEL=opencode/big-pickle` selects the OpenCode model string
- `SANDCASTLE_IMAGE_NAME=lush-guesser-sandcastle` selects the local Docker image
- `SANDCASTLE_TARGET_BRANCH=main` overrides the reviewer diff base; by default it
  uses the host's starting HEAD commit, resolved before issue branches are created

## Verification Commands

Agents should run this full verification set before committing unless a specific sandbox blocker prevents it:

```bash
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
- The default agent provider is OpenCode because the scaffold installs `opencode-ai` in `.sandcastle/Dockerfile`.
- `.sandcastle/.env` is intentionally ignored and must never be committed.
- Agents should use the glossary in `CONTEXT.md` and coding standards in `.sandcastle/CODING_STANDARDS.md`.
