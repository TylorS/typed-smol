import { spawn, spawnSync } from "node:child_process";

const appHost = process.env.APP_HOST ?? "127.0.0.1";
const appPort = Number(process.env.APP_PORT ?? "3100");
const appBase = process.env.APP_BASE ?? `http://${appHost}:${appPort}`;

try {
  const server = startAppServer();

  try {
    await waitForServer(server);
    runPlaywright();
  } finally {
    await stopAppServer(server);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

function startAppServer() {
  const child = spawn(
    "pnpm",
    [
      "exec",
      "vite",
      "--config",
      "vite.hmr.config.ts",
      "--host",
      appHost,
      "--port",
      String(appPort),
      "--strictPort",
    ],
    {
      env: { ...process.env, APP_BASE: appBase },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const server = { child, logs: [] };
  pipeServerLogs(server);
  return server;
}

async function waitForServer(server) {
  const deadline = Date.now() + Number(process.env.APP_READY_TIMEOUT_MS ?? "30000");
  while (Date.now() < deadline) {
    if (server.child.exitCode !== null) break;
    if (await serverResponds()) return;
    await delay(250);
  }

  throw new Error(
    [
      `Timed out waiting for RealWorld HMR app server at ${appBase}.`,
      ...server.logs.slice(-40),
    ].join("\n"),
  );
}

function runPlaywright() {
  const result = spawnSync(
    "pnpm",
    ["exec", "playwright", "test", "--config", "playwright.hmr.config.ts"],
    {
      encoding: "utf8",
      env: { ...process.env, APP_BASE: appBase },
    },
  );

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (isMissingPlaywrightBrowser(output)) {
    console.error(
      [
        "Playwright browsers are required for `pnpm --filter typed-realworld test:hmr:local`.",
        "Run `pnpm --filter typed-realworld exec playwright install chromium`, then rerun this command.",
      ].join("\n"),
    );
  }

  if ((result.status ?? 1) !== 0) throw new Error("RealWorld HMR Playwright suite failed");
}

async function stopAppServer(server) {
  if (server.child.exitCode !== null) return;
  const closed = new Promise((resolve) => server.child.once("close", () => resolve()));
  server.child.kill("SIGTERM");
  await Promise.race([
    closed,
    delay(5000).then(() => {
      if (server.child.exitCode === null) server.child.kill("SIGKILL");
    }),
  ]);
}

function pipeServerLogs(server) {
  const push = (chunk) => {
    const text = chunk.toString();
    process.stdout.write(text);
    server.logs.push(...text.split("\n").filter(Boolean));
    if (server.logs.length > 200) server.logs.splice(0, server.logs.length - 200);
  };
  server.child.stdout?.on("data", push);
  server.child.stderr?.on("data", push);
}

async function serverResponds() {
  try {
    const response = await fetch(appBase, { method: "GET" });
    return response.status < 500;
  } catch {
    return false;
  }
}

function isMissingPlaywrightBrowser(output) {
  return output.includes("Executable doesn't exist") || output.includes("playwright install");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
