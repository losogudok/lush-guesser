import { codex, opencode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export const imageName = process.env.SANDCASTLE_IMAGE_NAME ?? "lush-guesser-sandcastle";
export const models = {
  planner: process.env.SANDCASTLE_PLANNER_MODEL ?? "gpt-6.1-sol",
  implementer: process.env.SANDCASTLE_IMPLEMENTER_MODEL ?? process.env.SANDCASTLE_MODEL ?? "opencode-go/kimi-k3.1-pro",
  reviewer: process.env.SANDCASTLE_REVIEWER_MODEL ?? "gpt-6.1-sol",
  merger: process.env.SANDCASTLE_MERGER_MODEL ?? "gpt-6.1-sol",
};

export const agents = {
  planner: codex(models.planner, { effort: "high" }),
  implementer: opencode(models.implementer),
  reviewer: codex(models.reviewer, { effort: "high" }),
  merger: codex(models.merger, { effort: "medium" }),
};

export function sandboxMounts() {
  const codexAuthFile = resolve(
    process.env.SANDCASTLE_CODEX_AUTH_FILE ??
      join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "auth.json"),
  );
  if (!existsSync(codexAuthFile)) {
    throw new Error(`Codex login cache missing at ${codexAuthFile}. Run codex login on the host first.`);
  }
  return [
    {
      hostPath: join(homedir(), ".local/share/pnpm/store"),
      sandboxPath: "/home/agent/.local/share/pnpm/store",
    },
    {
      hostPath: codexAuthFile,
      sandboxPath: "/home/agent/.sandcastle-codex-auth.json",
      readonly: true,
    },
  ];
}

// Copy the login cache so token refreshes can write inside the container.
// Configure the Go provider explicitly; the Zen provider uses a different ID.
export const authSetupCommand = `install -D -m 600 /home/agent/.sandcastle-codex-auth.json /home/agent/.codex/auth.json && node -e '
  const fs = require("node:fs");
  const key = process.env.OPENCODE_GO_API_KEY || process.env.OPENCODE_API_KEY;
  if (!key) throw new Error("Set OPENCODE_GO_API_KEY in .sandcastle/.env");
  const directory = "/home/agent/.local/share/opencode";
  fs.mkdirSync(directory, {recursive: true});
  fs.writeFileSync(directory + "/auth.json", JSON.stringify({"opencode-go": {type: "api", key}}), {mode: 0o600});
'`;

export const hooks = {
  sandbox: {
    onSandboxReady: [
      { command: authSetupCommand },
      { command: "pnpm install --frozen-lockfile --store-dir /home/agent/.local/share/pnpm/store" },
      { command: "pnpm --dir frontend install --frozen-lockfile --store-dir /home/agent/.local/share/pnpm/store" },
      { command: "pnpm --dir server install --frozen-lockfile --store-dir /home/agent/.local/share/pnpm/store" },
    ],
  },
};

export const sandboxProvider = () => {
  const cpus = process.env.SANDCASTLE_CONTAINER_CPUS === undefined ? undefined : Number(process.env.SANDCASTLE_CONTAINER_CPUS);
  if (cpus !== undefined && (!Number.isFinite(cpus) || cpus <= 0)) {
    throw new Error("SANDCASTLE_CONTAINER_CPUS must be a positive number");
  }
  return docker({ imageName, mounts: sandboxMounts(), cpus });
};
