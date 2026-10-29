import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { run, type AgentProvider } from "@ai-hero/sandcastle";
import { noSandbox } from "@ai-hero/sandcastle/sandboxes/no-sandbox";
import { hooks } from "./runtime.mts";

const probe: AgentProvider = {
  name: "setup-test", env: {}, captureSessions: false,
  buildPrintCommand: () => ({ command: "node -e 'console.log(\"SETUP_READY\")'" }),
  parseStreamLine: line => [{ type: "text", text: line }],
};

for (const prefix of ["pnpm install", "pnpm --dir frontend install", "pnpm --dir server install"]) {
  test(`${prefix} tolerates setup beyond the SDK's default hook budget`, async () => {
    const hook = hooks.sandbox.onSandboxReady.find(hook => hook.command.startsWith(prefix));
    assert.ok(hook, `Missing dependency setup hook: ${prefix}`);
    const directory = mkdtempSync(join(tmpdir(), "sandcastle-hook-test-"));
    try {
      execFileSync("git", ["init", "-q"], { cwd: directory });
      writeFileSync(join(directory, ".gitignore"), ".sandcastle/\ngitconfig\n");
      execFileSync("git", ["add", ".gitignore"], { cwd: directory });
      execFileSync("git", ["-c", "user.name=Setup test", "-c", "user.email=test@localhost", "commit", "-qm", "Fixture"], { cwd: directory });

      // Scale 60 seconds to 60 ms and simulate a 120-second registry delay.
      // Exercise the installed SDK's timeout handling without network or models.
      const { timeoutMs = 60_000 } = hook as { timeoutMs?: number };
      const result = await run({
        cwd: directory, agent: probe, prompt: "Setup check", maxIterations: 1,
        sandbox: noSandbox({ env: { GIT_CONFIG_GLOBAL: join(directory, "gitconfig") } }),
        hooks: { sandbox: { onSandboxReady: [{
          command: "node -e 'setTimeout(() => {}, 120)'", timeoutMs: timeoutMs / 1000,
        }] } },
      });
      assert.match(result.stdout, /SETUP_READY/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
