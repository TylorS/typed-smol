import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const packageRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const extensionRoot = join(packageRoot, ".tmp/devtools-chrome-extension");
const userDataDir = join(packageRoot, ".tmp/devtools-chrome-user-data");
const extensionId = "bmbjfaomkfhmnnjlglbiihghfjkeooch";

if (!existsSync(join(extensionRoot, "manifest.json"))) {
  throw new Error("Run `pnpm --filter @typed/devtools-chrome build:extension` first.");
}

const context = await chromium.launchPersistentContext(userDataDir, {
  args: [`--disable-extensions-except=${extensionRoot}`, `--load-extension=${extensionRoot}`],
  headless: false,
});

try {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/panel.html`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector('[data-testid="connection-status"]');
  await expectText(page, "Components");
  await expectText(page, "RefSubjects");
  await expectText(page, "HMR");
  await expectText(page, "OTEL");
  await expectText(page, "Sources");
  await page.waitForSelector('[data-testid="panel-components"]');
  await page.waitForSelector('[data-testid="component-action-dom-cmp-app-root"]');
  await page.waitForSelector('[data-testid="component-action-source-cmp-app-root"]');
  await page.click('[data-testid="tab-Sources"]');
  await page.waitForSelector('[data-testid="panel-sources"]');
  await expectText(page, "file:///workspace/src/App.tsx");
  await page.click('[data-testid="tab-OTEL"]');
  await page.waitForSelector('[data-testid="panel-otel"]');
  await expectText(page, "trace-root/span-root");
  await page.reload();
  await page.waitForSelector('[data-testid="connection-status"]');
  await expectText(page, "runtime connected");
  await page.waitForSelector('[data-testid="panel-components"]');

  const response = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const port = chrome.runtime.connect({ name: "typed-devtools:rpc" });
      const timeout = setTimeout(
        () => reject(new Error("Timed out waiting for RPC response")),
        5000,
      );
      port.onMessage.addListener((message) => {
        clearTimeout(timeout);
        port.disconnect();
        resolve(message);
      });
      port.postMessage({
        id: 1,
        payload: {
          capabilities: ["components"],
          clientId: "browser-smoke",
          peer: "extension-panel",
          sessionId: "session-1",
          version: "0.1.0",
        },
        protocol: "typed-devtools",
        tag: "Handshake",
      });
    });
  });
  if (!JSON.stringify(response).includes("inspected-runtime")) {
    throw new Error(`Unexpected handshake response: ${JSON.stringify(response)}`);
  }
} finally {
  await context.close();
}

async function expectText(page, text) {
  const body = await page.textContent("body");
  if (!body?.includes(text)) throw new Error(`Missing browser smoke text: ${text}`);
}
