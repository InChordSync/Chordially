import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const rootDir = process.cwd();
const envTargets = [
  {
    source: "apps/api/.env.example",
    target: "apps/api/.env",
    label: "API"
  },
  {
    source: "apps/web/.env.example",
    target: "apps/web/.env.local",
    label: "web"
  },
  {
    source: "apps/mobile/.env.example",
    target: "apps/mobile/.env",
    label: "mobile"
  }
];

function parseArgs(argv) {
  return {
    skipInstall: argv.includes("--skip-install"),
    skipDocker: argv.includes("--skip-docker"),
    skipChecks: argv.includes("--skip-checks"),
    help: argv.includes("--help")
  };
}

function printHelp() {
  console.log(`Usage:
  node scripts/bootstrap-local.mjs [options]

Options:
  --skip-install    Do not run pnpm install
  --skip-docker     Do not start docker compose services
  --skip-checks     Do not run post-bootstrap verification commands
  --help            Show this help text
`);
}

function assertCommand(command, required = true) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  if (result.status === 0) {
    return true;
  }

  if (required) {
    throw new Error(`Required command not found in PATH: ${command}`);
  }

  return false;
}

function ensureEnvFiles() {
  for (const file of envTargets) {
    const source = path.join(rootDir, file.source);
    const target = path.join(rootDir, file.target);

    if (existsSync(target)) {
      console.log(`preserved ${file.target}`);
      continue;
    }

    copyFileSync(source, target);
    console.log(`created ${file.target} from ${file.source}`);
  }
}

function runCommand(command, args, options = {}) {
  const pretty = [command, ...args].join(" ");
  console.log(`> ${pretty}`);

  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    ...options
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${pretty}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  assertCommand("node");
  assertCommand("pnpm");

  ensureEnvFiles();

  if (!args.skipInstall) {
    runCommand("pnpm", ["install"]);
  }

  if (!args.skipDocker) {
    if (assertCommand("docker", false)) {
      runCommand("docker", ["compose", "up", "-d", "postgres", "redis"]);
    } else {
      console.log("skipping docker compose startup because docker is not installed");
    }
  }

  if (!args.skipChecks) {
    runCommand("pnpm", ["--filter", "@chordially/api", "check:env"]);
  }

  console.log("");
  console.log("Bootstrap complete.");
  console.log("Next steps:");
  console.log("- Start the API with `pnpm dev:api`");
  console.log("- Start the web app with `pnpm dev:web`");
  console.log("- Start the mobile app with `pnpm dev:mobile`");
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
