import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const apiSpecPath = ".temp/references/realworld/specs/api/hurl";
const workspaceRoot = resolve(process.cwd(), "../..");
const specDirectory = resolve(workspaceRoot, apiSpecPath);
const host = process.env.HOST ?? "http://127.0.0.1:3000/api";
const uid = process.env.UID_VAL ?? `${Date.now()}${process.pid}`;

if (!existsSync(specDirectory)) {
  fail([
    `RealWorld Hurl specs were not found at ${apiSpecPath}.`,
    "Clone or refresh the upstream RealWorld reference checkout before running this gate.",
  ]);
}

if (!commandExists("hurl")) {
  fail([
    "hurl is required for `pnpm --filter typed-realworld test:api:hurl:local`.",
    "Install Hurl, start the local RealWorld app server, then rerun this command.",
  ]);
}

const selectedFiles = selectHurlFiles(process.argv.slice(2));

console.log(`Running RealWorld Hurl specs from ${apiSpecPath}`);
console.log(`HOST=${host}`);
console.log(`UID_VAL=${uid}`);

const result = spawnSync("hurl", [
  "--test",
  "--jobs",
  "1",
  "--variable",
  `host=${host}`,
  "--variable",
  `uid=${uid}`,
  ...selectedFiles,
], {
  stdio: "inherit",
});

process.exitCode = result.status ?? 1;

function selectHurlFiles(args: readonly string[]): readonly string[] {
  if (args.length > 0) return args.map((file) => resolve(specDirectory, file));

  return readdirSync(specDirectory)
    .filter((file) => file.endsWith(".hurl"))
    .sort()
    .map((file) => resolve(specDirectory, file));
}

function commandExists(command: string): boolean {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

function fail(lines: readonly string[]): never {
  console.error(lines.join("\n"));
  process.exit(1);
}
