import { spawn, type ChildProcess } from "node:child_process";

const appHost = process.env.APP_HOST ?? "127.0.0.1";
const appPort = Number(process.env.APP_PORT ?? "3200");
const appBase = process.env.APP_BASE ?? `http://${appHost}:${appPort}`;
const smokePath = process.env.DEVTOOLS_SMOKE_PATH ?? "/index.devtools.html";

try {
  const server = startAppServer();

  try {
    await waitForServer(server);
    console.log(`RealWorld DevTools smoke URL: ${appBase}${smokePath}`);
    await waitForExit(server);
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

function waitForExit(server: ServerProcess): Promise<void> {
  return new Promise((resolve) => server.child.once("exit", () => resolve()));
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
    const response = await fetch(`${appBase}${smokePath}`, { method: "GET" });
    return response.status < 500;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ServerProcess = {
  readonly child: ChildProcess;
  readonly logs: string[];
};
