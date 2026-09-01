import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("the production shell serves the local Typed mark as its accessible brand", async (t) => {
  const port = await availablePort();
  const child = spawn(process.execPath, ["dist/server/server.js", "--port", String(port)], {
    cwd: import.meta.dirname + "/..",
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  t.after(async () => {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await once(child, "exit");
    }
  });

  const home = await waitForResponse(`http://127.0.0.1:${port}/`, child, () => stderr);
  const html = await home.text();
  assert.match(
    html,
    /<a class="brand"[^>]*aria-label="Typed home"[^>]*>[\s\S]*?<img[^>]*class="brand__logo"[^>]*alt=""/,
  );

  const logo = await fetch(`http://127.0.0.1:${port}/typed.svg`);
  assert.equal(logo.status, 200);
  assert.match(logo.headers.get("content-type") ?? "", /^image\/svg\+xml\b/);
  assert.match(await logo.text(), /@media\(prefers-reduced-motion: reduce\)[\s\S]*animation: none/);
});

test("semantic dark and light tokens meet WCAG AA contrast", async () => {
  const css = await readFile(new URL("../public/styles/tokens.css", import.meta.url), "utf8");
  const [darkSource, lightSource = ""] = css.split("@media (prefers-color-scheme: light)");
  const themes = {
    dark: readHexTokens(darkSource),
    light: readHexTokens(lightSource),
  };

  const pairs = [
    ["text", "bg", 7],
    ["text-soft", "bg", 4.5],
    ["muted", "bg", 4.5],
    ["accent", "bg", 4.5],
    ["accent-ink", "accent", 4.5],
    ["text", "surface", 7],
    ["text-soft", "surface", 4.5],
    ["muted", "surface", 4.5],
    ["text", "code-bg", 7],
    ["muted", "code-bg", 4.5],
    ["accent", "code-bg", 4.5],
    ["control-line", "surface", 3],
  ];

  for (const [theme, tokens] of Object.entries(themes)) {
    for (const [foreground, background, minimum] of pairs) {
      const ratio = contrast(tokens[foreground], tokens[background]);
      assert.ok(
        ratio >= minimum,
        `${theme} --${foreground} on --${background}: ${ratio.toFixed(2)} < ${minimum}`,
      );
    }
  }
});

test("symbol examples shrink to the viewport while code scrolls locally", async () => {
  const css = await readFile(new URL("../public/styles/reference.css", import.meta.url), "utf8");

  assert.match(css, /\.symbol-example-list[\s\S]*?\.symbol-example[\s\S]*?min-width:\s*0/);
  assert.match(css, /\.symbol-example \.markdown-body pre[\s\S]*?width:\s*100%/);
  assert.match(css, /\.symbol-example \.code-block[\s\S]*?overflow-x:\s*auto/);
});

function readHexTokens(source) {
  return Object.fromEntries(
    [...source.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})\s*;/giu)].map((match) => [
      match[1],
      match[2],
    ]),
  );
}

function contrast(foreground, background) {
  assert.ok(foreground, "foreground token is defined as a six-digit hex color");
  assert.ok(background, "background token is defined as a six-digit hex color");
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/.{2}/gu)
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

async function availablePort() {
  const { createServer } = await import("node:net");
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert(address && typeof address === "object");
  const port = address.port;
  server.close();
  await once(server, "close");
  return port;
}

async function waitForResponse(url, child, stderr) {
  let cause;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) {
      throw new Error(`server exited with ${child.exitCode}: ${stderr()}`);
    }
    try {
      return await fetch(url);
    } catch (error) {
      cause = error;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  throw new Error(`server did not become ready: ${stderr()}`, { cause });
}
