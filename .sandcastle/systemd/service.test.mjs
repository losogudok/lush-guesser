import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const source = dirname(fileURLToPath(import.meta.url));

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "sandcastle service-"));
  const project = join(root, "project with spaces");
  const home = join(root, "home");
  const bin = join(root, "bin");
  for (const directory of [join(project, ".sandcastle"), join(project, "node_modules/tsx"), home, bin]) mkdirSync(directory, { recursive: true });
  for (const file of [".sandcastle/main.mts", ".sandcastle/check.mts", "node_modules/tsx/package.json"]) writeFileSync(join(project, file), "");
  execFileSync("git", ["init", "-q", "-b", "dev", project]);
  const log = join(root, "systemctl.log");
  writeFileSync(join(bin, "systemctl"), `#!/usr/bin/env node
require('node:fs').appendFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2)) + '\\n');
`, { mode: 0o700 });
  const node = join(bin, "fake-node");
  writeFileSync(node, `#!/usr/bin/env node
console.log(JSON.stringify({cwd:process.cwd(),args:process.argv.slice(2)}));
if (process.env.HOLD_LOCK) { console.log('LOCKED'); setInterval(() => {}, 20000); }
`, { mode: 0o700 });
  const env = { ...process.env, HOME: home, PATH: `${bin}:${process.env.PATH}`, SANDCASTLE_PROJECT_DIR: project, SANDCASTLE_NODE_BIN: node, SANDCASTLE_EXPECTED_BRANCH: "dev" };
  return { root, project, home, env, log, clean() { rmSync(root, { recursive: true, force: true }); } };
}

test("installer creates a reusable unit, private project configuration, and enables the requested instance", () => {
  const f = fixture();
  try {
    const result = spawnSync(process.execPath, [join(source, "install.mjs"), "--name", "example", "--directory", f.project, "--image", "example-sandcastle", "--start"], { env: f.env, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const file = join(f.home, ".config/sandcastle/projects/example.env");
    const config = parseEnv(readFileSync(file, "utf8"));
    assert.equal(config.SANDCASTLE_PROJECT_DIR, f.project);
    assert.equal(config.SANDCASTLE_NODE_BIN, process.execPath);
    assert.equal(config.SANDCASTLE_EXPECTED_BRANCH, "dev");
    assert.equal(config.SANDCASTLE_MAX_ITERATIONS, "infinite");
    assert.equal(config.SANDCASTLE_MAX_PARALLEL_ISSUES, "1");
    assert.equal(config.SANDCASTLE_IMAGE_NAME, "example-sandcastle");
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.equal(statSync(join(f.home, ".local/libexec/sandcastle/launch")).mode & 0o777, 0o755);
    assert.match(readFileSync(join(f.home, ".local/libexec/sandcastle/install.mjs"), "utf8"), /Project prerequisite missing/);
    assert.deepEqual(readFileSync(f.log, "utf8").trim().split("\n").map(line => JSON.parse(line)), [
      ["--user", "daemon-reload"], ["--user", "enable", "--now", "sandcastle@example.service"],
    ]);
    assert.match(readFileSync(join(f.home, ".config/systemd/user/sandcastle@.service"), "utf8"), /Restart=on-abnormal/);
  } finally { f.clean(); }
});

test("reinstallation preserves project settings and rejects reusing an instance for another directory", () => {
  const f = fixture();
  try {
    const args = [join(source, "install.mjs"), "--name", "example", "--directory", f.project];
    let result = spawnSync(process.execPath, args, { env: f.env, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const file = join(f.home, ".config/sandcastle/projects/example.env");
    const custom = readFileSync(file, "utf8").replace('SANDCASTLE_POLL_INTERVAL_SECONDS="60"', 'SANDCASTLE_POLL_INTERVAL_SECONDS="300"');
    writeFileSync(file, custom);
    result = spawnSync(process.execPath, args, { env: f.env, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(file, "utf8"), custom);
    writeFileSync(file, custom.replace(f.project, "/another/project"));
    result = spawnSync(process.execPath, args, { env: f.env, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /already configured for another directory/);
  } finally { f.clean(); }
});

test("launcher uses the configured project and executable, including paths containing spaces", () => {
  const f = fixture();
  try {
    const result = spawnSync("bash", [join(source, "launch"), "check"], { env: f.env, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { cwd: f.project, args: ["--import", "tsx", ".sandcastle/check.mts"] });
  } finally { f.clean(); }
});

test("launcher refuses a different target branch before starting an agent", () => {
  const f = fixture();
  try {
    const result = spawnSync("bash", [join(source, "launch"), "run"], { env: { ...f.env, SANDCASTLE_EXPECTED_BRANCH: "main" }, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /expected branch main; found dev/);
  } finally { f.clean(); }
});

test("startup retries a temporary prerequisite failure before launching the watcher", () => {
  const f = fixture();
  const marker = join(f.root, "first-check-failed");
  try {
    writeFileSync(f.env.SANDCASTLE_NODE_BIN, `#!/usr/bin/env node
const fs = require('node:fs');
if (!fs.existsSync(${JSON.stringify(marker)})) { fs.writeFileSync(${JSON.stringify(marker)}, '1'); process.exit(1); }
process.stdout.write('Startup ready');
`, { mode: 0o700 });
    const result = spawnSync("bash", [join(source, "launch"), "check"], {
      env: { ...f.env, SANDCASTLE_STARTUP_ATTEMPTS: "2", SANDCASTLE_STARTUP_RETRY_SECONDS: "0" }, encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /startup check failed \(1\/2\)/);
    assert.equal(result.stdout, "Startup ready");
  } finally { f.clean(); }
});

test("duplicate service launch is locked while a different repository can run", { timeout: 5000 }, async () => {
  const first = fixture();
  const second = fixture();
  const child = spawn("bash", [join(source, "launch"), "run"], { env: { ...first.env, HOLD_LOCK: "1" }, stdio: ["ignore", "pipe", "pipe"] });
  const deadline = setTimeout(() => child.kill("SIGKILL"), 4000);
  try {
    await new Promise((resolve, reject) => {
      let output = "";
      child.stdout.on("data", chunk => { output += chunk; if (output.includes("LOCKED")) resolve(); });
      child.on("error", reject);
      child.on("exit", () => reject(new Error("Lock holder exited before readiness")));
    });
    const duplicate = spawnSync("bash", [join(source, "launch"), "run"], { env: first.env, encoding: "utf8", timeout: 1000 });
    assert.equal(duplicate.status, 75);
    assert.equal(duplicate.stdout, "");
    const separate = spawnSync("bash", [join(source, "launch"), "run"], { env: second.env, encoding: "utf8", timeout: 1000 });
    assert.equal(separate.status, 0, separate.stderr);
    assert.equal(JSON.parse(separate.stdout).cwd, second.project);
  } finally {
    clearTimeout(deadline);
    const closed = once(child, "close");
    child.kill("SIGTERM");
    await closed;
    first.clean(); second.clean();
  }
});
