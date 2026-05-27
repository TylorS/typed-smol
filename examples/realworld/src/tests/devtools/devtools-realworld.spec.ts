import { expect, test } from "@playwright/test";

const DEVTOOLS_PROTOCOL_VERSION = "0.1.0" as const;
const DEVTOOLS_SMOKE_PATH = process.env.DEVTOOLS_SMOKE_PATH ?? "/login";
const DEVTOOLS_WAIT_TIMEOUT_MS = Number(process.env.DEVTOOLS_WAIT_TIMEOUT_MS ?? "15000");

test("RealWorld devtools smoke page exposes inspected runtime replay", async ({ page }) => {
  await page.route(
    (url) => url.pathname === DEVTOOLS_SMOKE_PATH,
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

  await page.goto(DEVTOOLS_SMOKE_PATH);
  await page.waitForFunction(
    () => {
      const bridge = (globalThis as { readonly __TYPED_DEVTOOLS__?: unknown }).__TYPED_DEVTOOLS__;
      return typeof bridge === "object" && bridge !== null && "handshake" in bridge;
    },
    undefined,
    { timeout: DEVTOOLS_WAIT_TIMEOUT_MS },
  );

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

  await expect(page.locator(".auth-page")).toBeAttached({ timeout: DEVTOOLS_WAIT_TIMEOUT_MS });

  let runtimeItems: readonly RuntimeEventStreamItem[] = [];
  await expect
    .poll(
      async () => {
        runtimeItems = await page.evaluate(
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
        return runtimeItems.some((item) => {
          return (
            item._tag === "ComponentMounted" && (item.component?.domBindingIds.length ?? 0) > 0
          );
        });
      },
      { timeout: DEVTOOLS_WAIT_TIMEOUT_MS },
    )
    .toBe(true);

  expect(Array.isArray(runtimeItems)).toBe(true);
  expect(runtimeItems[0]).toMatchObject({
    _tag: "RuntimeReplayState",
    state: {
      _tag: "Ready",
      reconnectable: true,
      sessionId: handshake.sessionId,
    },
  });

  const componentEvent = runtimeItems.find((item): item is ComponentMountedStreamItem => {
    return item._tag === "ComponentMounted" && (item.component?.domBindingIds.length ?? 0) > 0;
  });

  expect(componentEvent).toBeDefined();
  expect(componentEvent!.component).toMatchObject({
    componentId: expect.stringMatching(/^cmp:/),
    displayName: expect.any(String),
    templateHash: expect.stringMatching(/^tpl:/),
  });

  const bindingId = componentEvent!.component.domBindingIds[0]!;
  const resolution = await page.evaluate(
    (request) => {
      const bridge = (globalThis as DevtoolsWindow).__TYPED_DEVTOOLS__;
      return bridge.resolveDomBinding(request);
    },
    { bindingId, includeRelated: true },
  );

  expect(resolution).toMatchObject({
    _tag: "Resolved",
    bindingId,
    component: {
      componentId: componentEvent!.component.componentId,
      displayName: componentEvent!.component.displayName,
    },
  });
});

interface DevtoolsWindow {
  readonly __TYPED_DEVTOOLS__: {
    readonly handshake: (request: DevtoolsHandshakeRequest) => DevtoolsHandshakeResponse;
    readonly resolveDomBinding: (request: DomBindingRequest) => DomBindingResolution;
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
  readonly component?: {
    readonly componentId: string;
    readonly displayName: string;
    readonly domBindingIds: readonly string[];
    readonly templateHash?: string;
  };
  readonly state?: {
    readonly _tag: string;
    readonly reconnectable?: boolean;
    readonly sessionId?: string;
  };
}

interface ComponentMountedStreamItem extends RuntimeEventStreamItem {
  readonly _tag: "ComponentMounted";
  readonly component: {
    readonly componentId: string;
    readonly displayName: string;
    readonly domBindingIds: readonly string[];
    readonly templateHash: string;
  };
}

interface DomBindingRequest {
  readonly bindingId: string;
  readonly includeRelated?: boolean;
}

interface DomBindingResolution {
  readonly _tag: string;
  readonly bindingId: string;
  readonly component?: {
    readonly componentId: string;
    readonly displayName: string;
  };
}
