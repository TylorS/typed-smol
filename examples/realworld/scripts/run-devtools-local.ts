import { spawn, type ChildProcess } from "node:child_process";

const appHost = process.env.APP_HOST ?? "localhost";
const appPort = Number(process.env.APP_PORT ?? "3200");
const appBase = process.env.APP_BASE ?? `http://${appHost}:${appPort}`;
const readinessPath = process.env.DEVTOOLS_READY_PATH ?? "/src/browser.devtools.ts";
const smokePath = process.env.DEVTOOLS_SMOKE_PATH ?? "/login";

try {
  const server = startAppServer();

  try {
    await waitForServer(server);
    console.log(`RealWorld DevTools smoke URL: ${appBase}${smokePath}`);
    await runPlaywright();
  } finally {
    await stopAppServer(server);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function startAppServer(): ServerProcess {
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", appHost, "--port", String(appPort), "--strictPort"],
    {
      env: { ...process.env, APP_BASE: appBase },
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
    [
      `Timed out waiting for RealWorld DevTools app server at ${appBase}.`,
      ...server.logs.slice(-40),
    ].join("\n"),
  );
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

function runPlaywright(): Promise<void> {
  const child = spawn(
    "pnpm",
    ["exec", "playwright", "test", "--config", "playwright.devtools.config.ts"],
    {
      env: { ...process.env, APP_BASE: appBase },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let output = "";
  const push = (chunk: Buffer) => {
    const text = chunk.toString();
    output += text;
    process.stdout.write(text);
  };

  child.stdout?.on("data", push);
  child.stderr?.on("data", push);

  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => {
      if (isMissingPlaywrightBrowser(output)) {
        console.error(
          [
            "Playwright browsers are required for `pnpm --filter typed-realworld test:devtools:local`.",
            "Run `pnpm --filter typed-realworld exec playwright install chromium`, then rerun this command.",
          ].join("\n"),
        );
      }
      if (code === 0) resolve();
      else reject(new Error("RealWorld DevTools Playwright suite failed"));
    });
  });
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
    const response = await fetch(`${appBase}${readinessPath}`, {
      method: "GET",
      signal: AbortSignal.timeout(2_000),
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isMissingPlaywrightBrowser(output: string): boolean {
  return output.includes("Executable doesn't exist") || output.includes("playwright install");
}

type ServerProcess = {
  readonly child: ChildProcess;
  readonly logs: string[];
};
