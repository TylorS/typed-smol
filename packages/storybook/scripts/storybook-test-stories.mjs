import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = 6173;
const baseUrl = `http://${host}:${port}`;

const storybook = spawn(
  "pnpm",
  [
    "exec",
    "storybook",
    "dev",
    "--config-dir",
    "fixtures/public-beta/.storybook",
    "--port",
    String(port),
    "--ci",
    "--no-open",
  ],
  {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, CI: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let storybookOutput = "";
storybook.stdout.on("data", (chunk) => {
  storybookOutput += chunk;
});
storybook.stderr.on("data", (chunk) => {
  storybookOutput += chunk;
});

try {
  await waitForStorybook();
  const result = await runVitestStories();
  if (result !== 0) process.exitCode = result;
} finally {
  storybook.kill("SIGTERM");
  await waitForExit(storybook);
}

async function runVitestStories() {
  const vitest = spawn(
    "pnpm",
    [
      "exec",
      "vitest",
      "run",
      "--config",
      "fixtures/public-beta/vitest.workspace.ts",
      "--project",
      "storybook",
    ],
    {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, STORYBOOK: "true" },
      stdio: "inherit",
    },
  );
  return waitForExit(vitest);
}

async function waitForStorybook() {
  const deadline = Date.now() + 60_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const story = await fetch(`${baseUrl}/iframe.html`);
      if (story.ok) return;
      lastError = new Error(`Storybook returned ${story.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  throw new Error(`Storybook test server timed out: ${String(lastError)}\n${storybookOutput}`);
}

function waitForExit(process) {
  return new Promise((resolve) => {
    process.once("exit", (code) => resolve(code ?? 0));
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
