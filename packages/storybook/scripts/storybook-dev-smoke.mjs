import { spawn } from "node:child_process";

const host = "127.0.0.1";
const port = 6173;
const baseUrl = `http://${host}:${port}`;
const storybookArgs = [
  "exec",
  "storybook",
  "dev",
  "--config-dir",
  "fixtures/public-beta/.storybook",
  "--port",
  String(port),
  "--ci",
  "--no-open",
];

const child = spawn("pnpm", storybookArgs, {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, CI: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
child.stdout.on("data", (chunk) => {
  output += chunk;
});
child.stderr.on("data", (chunk) => {
  output += chunk;
});

try {
  await waitForStorybook();
  await waitForApi();
} finally {
  child.kill("SIGTERM");
  await waitForExit(child);
}

async function waitForApi() {
  const deadline = Date.now() + 30_000;
  let lastBody = "";
  while (Date.now() < deadline) {
    const apiResponse = await fetch(`${baseUrl}/__typed_storybook_api/message`);
    lastBody = await apiResponse.text();
    if (apiResponse.ok) {
      const body = JSON.parse(lastBody);
      if (body.message !== "Default API dependency") {
        throw new Error(`Unexpected API smoke body: ${lastBody}`);
      }
      return;
    }
    await delay(500);
  }
  throw new Error(`Storybook API proxy smoke timed out: ${lastBody}\n${output}`);
}

async function waitForStorybook() {
  const deadline = Date.now() + 60_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const story = await fetch(
        `${baseUrl}/iframe.html?id=typed-public-beta--route-backed&viewMode=story`,
      );
      if (story.ok) return;
      lastError = new Error(`Story iframe returned ${story.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  throw new Error(`Storybook dev smoke timed out: ${String(lastError)}\n${output}`);
}

function waitForExit(process) {
  return new Promise((resolve) => {
    process.once("exit", resolve);
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
