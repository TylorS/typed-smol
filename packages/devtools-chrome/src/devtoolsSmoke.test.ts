import { DevtoolsProtocolFixtures } from "@typed/devtools-protocol";
import { describe, expect, it } from "vitest";
import manualSmoke from "../MANUAL_SMOKE.md?raw";
import { registerTypedDevtoolsPage } from "./devtoolsPage.js";
import { elementsSidebarModel, registerTypedElementsSidebar } from "./elementsSidebar.js";
import { makeTypedDevtoolsManifest } from "./manifest.js";
import { registerTypedSourcesSidebar, sourcesSidebarModel } from "./sourcesSidebar.js";
import {
  TYPED_DEVTOOLS_CHROME_PORT,
  makeChromeRuntimeRpcClient,
  type ChromeRuntimeRpcRequest,
} from "./transport/chromeRuntime.js";

describe("Chrome DevTools smoke coverage", () => {
  it("smokes manifest, panel, Elements sidebar, and Sources sidebar wiring", async () => {
    const chrome = makeSmokeChrome();

    expect(makeTypedDevtoolsManifest()).toMatchObject({
      devtools_page: "devtools.html",
      manifest_version: 3,
      name: "Typed DevTools",
    });
    registerTypedDevtoolsPage(chrome);
    registerTypedElementsSidebar(chrome, {
      resolveSelectedElement: () => Promise.resolve(DevtoolsProtocolFixtures.domBindingResolution),
    });
    registerTypedSourcesSidebar(chrome, {
      selection: () => Promise.resolve(DevtoolsProtocolFixtures.sourceAnalyzerRequest),
    });

    await chrome.emitElementsSelection();
    await chrome.emitSourcesSelection();

    expect(chrome.createdPanels).toEqual([
      {
        iconPath: "icons/typed-devtools-32.png",
        pagePath: "panel.html",
        title: "Typed",
      },
    ]);
    expect(chrome.elementsSidebar.objects).toEqual([
      {
        object: elementsSidebarModel(DevtoolsProtocolFixtures.domBindingResolution),
        rootTitle: "Typed",
      },
    ]);
    expect(chrome.sourcesSidebar.objects).toEqual([
      {
        object: sourcesSidebarModel(DevtoolsProtocolFixtures.sourceAnalyzerResponse),
        rootTitle: "Typed",
      },
    ]);
    expect(chrome.runtime.messages).toMatchObject([
      {
        payload: DevtoolsProtocolFixtures.sourceAnalyzerRequest,
        protocol: "typed-devtools",
        tag: "AnalyzeSource",
      },
    ]);
  });

  it("smokes runtime reconnect after extension reload", async () => {
    const runtime = makeFakeRuntime();
    const first = makeChromeRuntimeRpcClient(runtime);

    await expect(
      first.request("Handshake", DevtoolsProtocolFixtures.handshakeRequest),
    ).resolves.toEqual(DevtoolsProtocolFixtures.handshakeResponse);
    first.disconnect();
    const second = makeChromeRuntimeRpcClient(runtime);
    await expect(
      second.request("AnalyzeSource", DevtoolsProtocolFixtures.sourceAnalyzerRequest),
    ).resolves.toEqual(DevtoolsProtocolFixtures.sourceAnalyzerResponse);

    expect(runtime.connectedNames).toEqual([
      TYPED_DEVTOOLS_CHROME_PORT,
      TYPED_DEVTOOLS_CHROME_PORT,
    ]);
    expect(runtime.disconnectCount).toBe(1);
  });

  it("documents manual browser smoke steps for non-automated assertions", () => {
    expect(manualSmoke).toContain("pnpm --filter @typed/devtools-chrome build");
    expect(manualSmoke).toContain("chrome://extensions");
    expect(manualSmoke).toContain("Load unpacked");
    expect(manualSmoke).toContain("Typed panel");
    expect(manualSmoke).toContain("Elements sidebar");
    expect(manualSmoke).toContain("Sources Analyzer");
    expect(manualSmoke).toContain("Reload and reconnect");
  });
});

function makeSidebar() {
  return {
    objects: [] as { readonly object: unknown; readonly rootTitle?: string }[],
    page: "",
    setObject(object: unknown, rootTitle?: string) {
      this.objects.push({ object, rootTitle });
    },
    setPage(page: string) {
      this.page = page;
    },
  };
}

function makeSmokeChrome() {
  let elementsListener: (() => void | Promise<void>) | undefined;
  let sourcesListener: (() => void | Promise<void>) | undefined;
  const runtime = makeFakeRuntime();
  const elementsSidebar = makeSidebar();
  const sourcesSidebar = makeSidebar();
  const createdPanels: {
    readonly iconPath: string;
    readonly pagePath: string;
    readonly title: string;
  }[] = [];

  return {
    createdPanels,
    elementsSidebar,
    runtime,
    sourcesSidebar,
    devtools: {
      panels: {
        create(title: string, iconPath: string, pagePath: string) {
          createdPanels.push({ iconPath, pagePath, title });
        },
        elements: {
          createSidebarPane(_title: string, callback: (sidebar: typeof elementsSidebar) => void) {
            callback(elementsSidebar);
          },
          onSelectionChanged: {
            addListener(nextListener: () => void | Promise<void>) {
              elementsListener = nextListener;
            },
          },
        },
        sources: {
          createSidebarPane(_title: string, callback: (sidebar: typeof sourcesSidebar) => void) {
            callback(sourcesSidebar);
          },
          onSelectionChanged: {
            addListener(nextListener: () => void | Promise<void>) {
              sourcesListener = nextListener;
            },
          },
        },
      },
    },
    async emitElementsSelection() {
      await elementsListener?.();
    },
    async emitSourcesSelection() {
      await sourcesListener?.();
    },
  };
}

function makeFakeRuntime() {
  const listeners = new Set<(message: unknown) => void>();
  return {
    connectedNames: [] as string[],
    disconnectCount: 0,
    messages: [] as unknown[],
    connect(options?: { readonly name?: string }) {
      this.connectedNames.push(options?.name ?? "");
      return {
        disconnect: () => {
          this.disconnectCount++;
        },
        onDisconnect: {
          addListener: () => undefined,
          removeListener: () => undefined,
        },
        onMessage: {
          addListener: (listener: (message: unknown) => void) => listeners.add(listener),
          removeListener: (listener: (message: unknown) => void) => listeners.delete(listener),
        },
        postMessage: (message: unknown) => {
          this.messages.push(message);
          const request = message as ChromeRuntimeRpcRequest;
          queueMicrotask(() => {
            for (const listener of listeners) {
              listener({
                id: request.id,
                protocol: request.protocol,
                success: successFor(request),
                tag: request.tag,
              });
            }
          });
        },
      };
    },
  };
}

function successFor(request: ChromeRuntimeRpcRequest): unknown {
  switch (request.tag) {
    case "AnalyzeSource":
      return DevtoolsProtocolFixtures.sourceAnalyzerResponse;
    case "Handshake":
      return DevtoolsProtocolFixtures.handshakeResponse;
    case "ResolveDomBinding":
      return DevtoolsProtocolFixtures.domBindingResolution;
    case "SubscribeRuntimeEvents":
      return DevtoolsProtocolFixtures.runtimeEvents[0];
  }
}
