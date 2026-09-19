# Sandcastle

This repo uses Sandcastle to run coding agents in isolated Docker sandboxes.

## Setup

1. Install root dependencies:

```bash
npm ci
```

2. Create a local Sandcastle environment file:

```bash
cp .sandcastle/.env.example .sandcastle/.env
```

Fill in:

- `OPENCODE_API_KEY` for the default OpenCode agent provider
- `GH_TOKEN` with GitHub Issues read/write access

3. Build the sandbox image:

```bash
npm run sandcastle:build-image
```

## Running Agents

Sandcastle works from GitHub Issues labeled `Sandcastle`.

```bash
npm run sandcastle
```

Optional environment variables:

- `SANDCASTLE_MAX_ITERATIONS=1` controls plan/execute/merge loops
- `SANDCASTLE_MODEL=opencode/big-pickle` selects the OpenCode model string
- `SANDCASTLE_IMAGE_NAME=lush-guesser-sandcastle` selects the local Docker image
- `SANDCASTLE_TARGET_BRANCH=main` sets the diff base for reviewer prompts

## Verification Commands

Agents should run this full verification set before committing unless a specific sandbox blocker prevents it:

```bash
npm run validate:catalog --prefix frontend
npm run lint --prefix frontend
npm run build --prefix frontend
npm run lint --prefix server
npm test --prefix server -- --passWithNoTests
npm run test:e2e --prefix server
npm run build --prefix server
npm run test:e2e
```

`npm run test:e2e` at the repo root runs the Playwright smoke test on isolated ports.

## Operational Notes

- The Docker sandbox image is based on Node 24 to match the app.
- The default agent provider is OpenCode because the scaffold installs `opencode-ai` in `.sandcastle/Dockerfile`.
- `.sandcastle/.env` is intentionally ignored and must never be committed.
- Agents should use the glossary in `CONTEXT.md` and coding standards in `.sandcastle/CODING_STANDARDS.md`.
