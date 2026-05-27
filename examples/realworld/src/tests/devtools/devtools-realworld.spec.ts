import { expect, test } from "@playwright/test";

const DEVTOOLS_PROTOCOL_VERSION = "0.1.0" as const;

test("RealWorld devtools smoke page exposes inspected runtime replay", async ({ page }) => {
  await page.route(
    (url) => url.pathname === "/devtools-smoke.html",
    async (route) => {
      await route.fulfill({
        body: [
          "<!doctype html>",
          '<html lang="en">',
          "<head>",
          '<meta charset="UTF-8" />',
          '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
          "<title>Conduit DevTools Smoke</title>",
          "</head>",
          "<body>",
          '<div id="typed-root"></div>',
          '<script type="module" src="/src/browser.devtools.ts"></script>',
          "</body>",
          "</html>",
        ].join("\n"),
        contentType: "text/html; charset=utf-8",
      });
    },
  );

  await page.goto("/devtools-smoke.html");
  await page.waitForFunction(() => {
    const bridge = (globalThis as { readonly __TYPED_DEVTOOLS__?: unknown }).__TYPED_DEVTOOLS__;
    return typeof bridge === "object" && bridge !== null && "handshake" in bridge;
  });

  const handshake = await page.evaluate((version) => {
    const bridge = (globalThis as DevtoolsWindow).__TYPED_DEVTOOLS__;
    return bridge.handshake({
      capabilities: [
        "components",
        "dom",
        "fx",
        "hmr",
        "navigation",
        "otel",
        "refsubjects",
        "source-analyzer",
      ],
      clientId: "client:realworld-devtools-smoke",
      peer: "extension-panel",
      sessionId: "session:realworld-devtools-smoke",
      version,
    });
  }, DEVTOOLS_PROTOCOL_VERSION);

  console.log(
    `RealWorld DevTools accepted capabilities: ${handshake.acceptedCapabilities.join(",")}`,
  );
  expect(handshake.peer).toBe("inspected-runtime");
  expect(handshake.version).toBe(DEVTOOLS_PROTOCOL_VERSION);
  expect(handshake.acceptedCapabilities).toContain("components");
  expect(handshake.acceptedCapabilities).toContain("dom");

  const runtimeItems = await page.evaluate(
    (request) => {
      const bridge = (globalThis as DevtoolsWindow).__TYPED_DEVTOOLS__;
      return bridge.subscribeRuntimeEvents(request);
    },
    {
      capabilities: ["components"],
      replay: true,
      sessionId: handshake.sessionId,
      sinceSequence: 0,
    },
  );

  expect(Array.isArray(runtimeItems)).toBe(true);
  expect(runtimeItems[0]).toMatchObject({
    _tag: "RuntimeReplayState",
    state: {
      _tag: "Ready",
      reconnectable: true,
      sessionId: handshake.sessionId,
    },
  });
});

interface DevtoolsWindow {
  readonly __TYPED_DEVTOOLS__: {
    readonly handshake: (request: DevtoolsHandshakeRequest) => DevtoolsHandshakeResponse;
    readonly subscribeRuntimeEvents: (
      request: RuntimeEventSubscriptionRequest,
    ) => readonly RuntimeEventStreamItem[];
  };
}

interface DevtoolsHandshakeRequest {
  readonly capabilities: readonly string[];
  readonly clientId: string;
  readonly peer: string;
  readonly sessionId: string;
  readonly version: string;
}

interface DevtoolsHandshakeResponse {
  readonly acceptedCapabilities: readonly string[];
  readonly peer: string;
  readonly sessionId: string;
  readonly unsupportedCapabilities: readonly string[];
  readonly version: string;
}

interface RuntimeEventSubscriptionRequest {
  readonly capabilities: readonly string[];
  readonly replay: boolean;
  readonly sessionId: string;
  readonly sinceSequence: number;
}

interface RuntimeEventStreamItem {
  readonly _tag: string;
  readonly state?: {
    readonly _tag: string;
    readonly reconnectable?: boolean;
    readonly sessionId?: string;
  };
}
