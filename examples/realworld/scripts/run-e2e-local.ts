import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const e2eSpecPath = ".temp/references/realworld/specs/e2e";
const workspaceRoot = resolve(process.cwd(), "../..");
const specDirectory = resolve(workspaceRoot, e2eSpecPath);
const appBase = process.env.APP_BASE ?? "http://127.0.0.1:3000";
const apiBase = process.env.API_BASE ?? `${appBase}/api`;

if (!existsSync(specDirectory)) {
  fail([
    `RealWorld Playwright specs were not found at ${e2eSpecPath}.`,
    "Clone or refresh the upstream RealWorld reference checkout before running this gate.",
  ]);
}

if (!(await serverResponds(appBase))) {
  fail([
    "A local RealWorld app server is required for `pnpm --filter typed-realworld test:e2e:local`.",
    `Start the app server at APP_BASE=${appBase}, or set APP_BASE to the running server URL.`,
  ]);
}

console.log(`Running RealWorld Playwright specs from ${e2eSpecPath}`);
console.log(`APP_BASE=${appBase}`);
console.log(`API_BASE=${apiBase}`);

const result = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "--config", "playwright.config.ts", ...process.argv.slice(2)],
  {
    encoding: "utf8",
    env: {
      ...process.env,
      API_BASE: apiBase,
      APP_BASE: appBase,
    },
  },
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if (isMissingPlaywrightBrowser(output)) {
  console.error(
    [
      "Playwright browsers are required for `pnpm --filter typed-realworld test:e2e:local`.",
      "Run `pnpm --filter typed-realworld exec playwright install chromium`, then rerun this command.",
    ].join("\n"),
  );
}

process.exitCode = result.status ?? 1;

async function serverResponds(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "GET" });
    return response.status < 500;
  } catch {
    return false;
  }
}

function isMissingPlaywrightBrowser(output: string): boolean {
  return output.includes("Executable doesn't exist") || output.includes("playwright install");
}

function fail(lines: readonly string[]): never {
  console.error(lines.join("\n"));
  process.exit(1);
}
