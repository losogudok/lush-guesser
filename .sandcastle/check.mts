import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { authSetupCommand, imageName, models, sandboxMounts } from "./runtime.mts";

// Check setup without invoking a model, changing branches, or editing issues.
const configuredEnv = parseEnv(readFileSync(new URL(".env", import.meta.url), "utf8"));
// Match Sandcastle: nonempty .env values take precedence over host values.
const env = { ...process.env };
for (const [key, value] of Object.entries(configuredEnv)) {
  env[key] = value || process.env[key];
}
env.OPENCODE_GO_API_KEY ||= env.OPENCODE_API_KEY;
for (const key of ["OPENCODE_GO_API_KEY", "GH_TOKEN"]) {
  if (!env[key]?.trim()) {
    throw new Error(`Set ${key} in .sandcastle/.env before running Sandcastle`);
  }
}

const repo = execFileSync("gh", ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"], {
  env,
  encoding: "utf8",
  timeout: 30_000,
}).trim();

execFileSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
  stdio: "inherit",
  timeout: 30_000,
});
execFileSync("docker", [
  "run", "--rm",
  "--user", `${process.getuid!()}:${process.getgid!()}`,
  ...sandboxMounts().flatMap(mount => [
    "--mount", `type=bind,source=${mount.hostPath},target=${mount.sandboxPath}${mount.readonly ? ",readonly" : ""}`,
  ]),
  "--env", "OPENCODE_GO_API_KEY", "--env", "GH_TOKEN",
  "--env", `SANDCASTLE_REPO=${repo}`,
  "--env", `SANDCASTLE_IMPLEMENTER_MODEL=${models.implementer}`,
  "--entrypoint", "sh", imageName, "-ec", `
    ${authSetupCommand}
    node --version
    test "$(node -p 'process.versions.node.split(".")[0]')" = 24
    test "$(pnpm --version)" = 12.14.0
    git --version
    gh --version | head -1
    opencode --version
    codex --version
    codex login status >/dev/null 2>&1
    echo "Codex cached login: OK"
    opencode models opencode-go | grep -Fx "$SANDCASTLE_IMPLEMENTER_MODEL"
    gh issue list --repo "$SANDCASTLE_REPO" --state open --label ready-for-agent --limit 100 --json number --jq 'length'
    NODE_PATH="$(npm root -g)" node -e '
      const { chromium } = require("@playwright/test");
      (async () => {
        const browser = await chromium.launch({args: ["--no-sandbox"]});
        const page = await browser.newPage();
        await page.setContent("<title>Sandcastle setup check</title>");
        if (await page.title() !== "Sandcastle setup check") throw new Error("Chromium smoke check failed");
        await browser.close();
        console.log("Chromium launch: OK");
      })().catch(error => { console.error(error.message); process.exitCode = 1; });
    '
  `,
], { env, stdio: "inherit", timeout: 120_000 });

for (const [role, model] of Object.entries(models)) {
  console.log(`${role}: ${model}`);
}
console.log("Sandcastle setup: OK (live inference and issue write access not tested)");
