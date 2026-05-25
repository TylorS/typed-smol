import { spawn, spawnSync, type ChildProcess } from "node:child_process";

const appHost = process.env.APP_HOST ?? "127.0.0.1";
const appPort = Number(process.env.APP_PORT ?? "3000");
const appBase = process.env.APP_BASE ?? `http://${appHost}:${appPort}`;
const apiBase = process.env.API_BASE ?? `${appBase}/api`;
const nodeExecutable = process.argv[0] ?? "node";

type ServerProcess = {
  readonly child: ChildProcess;
  readonly logs: string[];
};

try {
  runPreflight();
  runDbReset();
  const server = startAppServer();

  try {
    await waitForServer(server);
    runHurl();
    runE2e();
  } finally {
    await stopAppServer(server);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function runPreflight(): void {
  if (!commandExists("hurl")) {
    throw new Error(
      [
        "hurl is required for `pnpm --filter typed-realworld test:acceptance:local`.",
        "Install Hurl before running the full local acceptance gate.",
      ].join("\n"),
    );
  }
}

function runDbReset(): void {
  runCommand("db reset", nodeExecutable, ["dist/types/scripts/db.js", "reset"]);
}

function startAppServer(): ServerProcess {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", appHost, "--port", String(appPort), "--strictPort"],
    {
      env: {
        ...process.env,
        API_BASE: apiBase,
        APP_BASE: appBase,
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const server = { child, logs: [] };
  pipeServerLogs(server);
  return server;
}

async function waitForServer(server: ServerProcess): Promise<void> {
  const deadline = Date.now() + Number(process.env.APP_READY_TIMEOUT_MS ?? "30000");
  while (Date.now() < deadline) {
    if (server.child.exitCode !== null) break;
    if (await serverResponds()) return;
    await delay(250);
  }

  throw new Error(
    [`Timed out waiting for RealWorld app server at ${appBase}.`, ...server.logs.slice(-40)].join(
      "\n",
    ),
  );
}

function runHurl(): void {
  runCommand("Hurl acceptance", nodeExecutable, ["dist/types/scripts/run-hurl-local.js"], {
    HOST: appBase,
    UID_VAL: process.env.UID_VAL ?? `${Date.now()}${process.pid}`,
  });
}

function runE2e(): void {
  runCommand("Playwright acceptance", nodeExecutable, ["dist/types/scripts/run-e2e-local.js"], {
    API_BASE: apiBase,
    APP_BASE: appBase,
  });
}

async function stopAppServer(server: ServerProcess): Promise<void> {
  if (server.child.exitCode !== null) return;
  const closed = new Promise<void>((resolve) => server.child.once("close", () => resolve()));
  server.child.kill("SIGTERM");
  await Promise.race([
    closed,
    delay(5000).then(() => {
      if (server.child.exitCode === null) server.child.kill("SIGKILL");
    }),
  ]);
}

function runCommand(
  label: string,
  command: string,
  args: readonly string[],
  env: NodeJS.ProcessEnv = {},
): void {
  console.log(`Running ${label}`);
  const result = spawnSync(command, args, {
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  if ((result.status ?? 1) !== 0) throw new Error(`${label} failed`);
}

function commandExists(command: string): boolean {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

function pipeServerLogs(server: ServerProcess): void {
  const push = (chunk: Buffer) => {
    const text = chunk.toString();
    process.stdout.write(text);
    server.logs.push(...text.split("\n").filter(Boolean));
    if (server.logs.length > 200) server.logs.splice(0, server.logs.length - 200);
  };
  server.child.stdout?.on("data", push);
  server.child.stderr?.on("data", push);
}

async function serverResponds(): Promise<boolean> {
  try {
    const response = await fetch(appBase, { method: "GET" });
    return response.status < 500;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
