import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const arguments_ = process.argv.slice(2);
if (arguments_.includes("--help")) {
  console.log(`Usage: node .sandcastle/systemd/install.mjs [--name NAME] [--directory PATH] [--image IMAGE] [--start]

Installs a reusable user systemd template and enables one project instance.
--start also starts it after installation. Existing project configuration is preserved.
`);
  process.exit(0);
}
const values = {};
let start = false;
for (let index = 0; index < arguments_.length; index++) {
  const argument = arguments_[index];
  if (argument === "--start") { start = true; continue; }
  if (!["--name", "--directory", "--image"].includes(argument) || !arguments_[index + 1] || arguments_[index + 1].startsWith("--")) {
    throw new Error(`Unknown or incomplete argument: ${argument}`);
  }
  values[argument.slice(2)] = arguments_[++index];
}

const directory = realpathSync(resolve(values.directory ?? process.cwd()));
const name = values.name ?? basename(directory);
if (!/^[a-z0-9][a-z0-9_-]*$/.test(name)) throw new Error("Project name must use lowercase letters, digits, hyphens, or underscores");
for (const file of [".sandcastle/main.mts", ".sandcastle/check.mts", "node_modules/tsx/package.json"]) {
  if (!existsSync(join(directory, file))) throw new Error(`Project prerequisite missing: ${file}`);
}
const branch = execFileSync("git", ["branch", "--show-current"], { cwd: directory, encoding: "utf8" }).trim();
if (!branch) throw new Error("Check out the branch that should receive Sandcastle results first");

const source = dirname(fileURLToPath(import.meta.url));
const unitDirectory = join(homedir(), ".config/systemd/user");
const configDirectory = join(homedir(), ".config/sandcastle/projects");
const executableDirectory = join(homedir(), ".local/libexec/sandcastle");
const configuration = join(configDirectory, `${name}.env`);
if (existsSync(configuration) && parseEnv(readFileSync(configuration, "utf8")).SANDCASTLE_PROJECT_DIR !== directory) {
  throw new Error(`Instance ${name} is already configured for another directory. Choose a different --name.`);
}
for (const path of [unitDirectory, configDirectory, executableDirectory]) mkdirSync(path, { recursive: true });
writeFileSync(join(unitDirectory, "sandcastle@.service"), readFileSync(join(source, "sandcastle@.service")), { mode: 0o644 });
for (const file of ["launch", "install.mjs", "sandcastle@.service"]) {
  writeFileSync(join(executableDirectory, file), readFileSync(join(source, file)), { mode: file === "launch" ? 0o755 : 0o644 });
}

const quote = value => {
  if (/[\r\n\0]/.test(value)) throw new Error("Configuration values cannot contain newlines or NUL");
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
};
if (!existsSync(configuration)) {
  const node = realpathSync(process.execPath);
  const settings = {
    SANDCASTLE_PROJECT_DIR: directory,
    SANDCASTLE_NODE_BIN: node,
    PATH: [dirname(node), join(homedir(), ".local/share/pnpm"), "/usr/local/bin", "/usr/bin", "/bin"].join(":"),
    SANDCASTLE_EXPECTED_BRANCH: branch,
    SANDCASTLE_IMAGE_NAME: values.image ?? `${basename(directory)}-sandcastle`,
    SANDCASTLE_MAX_ITERATIONS: "infinite",
    SANDCASTLE_POLL_INTERVAL_SECONDS: "60",
    SANDCASTLE_MAX_PARALLEL_ISSUES: "1",
    SANDCASTLE_CONTAINER_CPUS: "2",
  };
  writeFileSync(configuration, Object.entries(settings).map(([key, value]) => `${key}=${quote(value)}`).join("\n") + "\n", { mode: 0o600 });
} else {
  console.log(`Preserving existing configuration: ${configuration}`);
}

execFileSync("systemctl", ["--user", "daemon-reload"], { stdio: "inherit" });
const unit = `sandcastle@${name}.service`;
execFileSync("systemctl", ["--user", "enable", ...(start ? ["--now"] : []), unit], { stdio: "inherit" });
console.log(`${unit}: enabled${start ? " and start requested" : ""}`);
console.log(`Configuration: ${configuration}`);
console.log(`Status: systemctl --user status ${unit}`);
console.log(`Logs: journalctl --user -u ${unit} -f`);
