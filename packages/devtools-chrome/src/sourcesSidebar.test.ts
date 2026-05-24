import {
  DevtoolsProtocolFixtures,
  makeSourceLocationId,
  type SourceAnalyzerRequest,
  type SourceAnalyzerResponse,
} from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  registerTypedSourcesSidebar,
  sourcesSidebarModel,
  type SourcesSidebarModel,
} from "./sourcesSidebar.js";

describe("Chrome Sources sidebar", () => {
  it("renders AnalyzeSource facts from the selected source", async () => {
    const chrome = makeFakeSourcesChrome();
    const requests: SourceAnalyzerRequest[] = [];
    registerTypedSourcesSidebar(chrome, {
      analyzer: {
        analyzeSource: (request) => {
          requests.push(request);
          return Promise.resolve(DevtoolsProtocolFixtures.sourceAnalyzerResponse);
        },
      },
      selection: () => Promise.resolve(DevtoolsProtocolFixtures.sourceAnalyzerRequest),
    });

    await chrome.emitSelectionChanged();

    expect(requests).toEqual([DevtoolsProtocolFixtures.sourceAnalyzerRequest]);
    expect(chrome.sidebar.page).toBe("sourcesSidebar.html");
    expect(chrome.sidebar.objects).toEqual([
      {
        object: sourcesSidebarModel(DevtoolsProtocolFixtures.sourceAnalyzerResponse),
        rootTitle: "Typed",
      },
    ]);
  });

  it("renders an unavailable model when the analyzer bridge is missing", async () => {
    const chrome = makeFakeSourcesChrome();
    registerTypedSourcesSidebar(chrome, {
      selection: () => Promise.resolve(DevtoolsProtocolFixtures.sourceAnalyzerRequest),
    });

    await chrome.emitSelectionChanged();

    expect(chrome.sidebar.objects).toEqual([
      {
        object: {
          _tag: "Unavailable",
          reason: "Source analyzer bridge is not available",
          requestedAt: DevtoolsProtocolFixtures.sourceAnalyzerRequest.requestedAt,
        },
        rootTitle: "Typed",
      },
    ]);
  });

  it("requests AnalyzeSource through chrome.runtime when no analyzer is injected", async () => {
    const runtime = makeFakeRuntime();
    const chrome = makeFakeSourcesChrome(runtime);
    registerTypedSourcesSidebar(chrome, {
      selection: () => Promise.resolve(DevtoolsProtocolFixtures.sourceAnalyzerRequest),
    });

    await chrome.emitSelectionChanged();

    expect(runtime.messages).toEqual([
      {
        id: 1,
        payload: DevtoolsProtocolFixtures.sourceAnalyzerRequest,
        protocol: "typed-devtools",
        tag: "AnalyzeSource",
      },
    ]);
    expect(chrome.sidebar.objects).toEqual([
      {
        object: sourcesSidebarModel(DevtoolsProtocolFixtures.sourceAnalyzerResponse),
        rootTitle: "Typed",
      },
    ]);
  });

  it("renders unavailable when the analyzer rejects", async () => {
    const chrome = makeFakeSourcesChrome();
    registerTypedSourcesSidebar(chrome, {
      analyzer: {
        analyzeSource: () => Promise.reject(new Error("analyzer service crashed")),
      },
      selection: () => Promise.resolve(DevtoolsProtocolFixtures.sourceAnalyzerRequest),
    });

    await chrome.emitSelectionChanged();

    expect(chrome.sidebar.objects).toEqual([
      {
        object: {
          _tag: "Unavailable",
          reason: "Typed Sources analyzer failed: analyzer service crashed",
          requestedAt: DevtoolsProtocolFixtures.sourceAnalyzerRequest.requestedAt,
        },
        rootTitle: "Typed",
      },
    ]);
  });

  it("keeps the newest source facts when async selections resolve out of order", async () => {
    const firstResponse = deferred<SourceAnalyzerResponse>();
    const secondResponse = deferred<SourceAnalyzerResponse>();
    const secondFacts = {
      ...DevtoolsProtocolFixtures.sourceAnalyzerResponse,
      facts: [
        {
          _tag: "FxDefinition",
          fxNodeId: DevtoolsProtocolFixtures.ids.fxNode,
          sourceLocationId: makeSourceLocationId("src/App.tsx:20:5"),
        },
      ],
    } as const satisfies SourceAnalyzerResponse;
    const chrome = makeFakeSourcesChrome();
    let callIndex = 0;
    registerTypedSourcesSidebar(chrome, {
      analyzer: {
        analyzeSource: () => (++callIndex === 1 ? firstResponse.promise : secondResponse.promise),
      },
      selection: () => Promise.resolve(DevtoolsProtocolFixtures.sourceAnalyzerRequest),
    });

    const firstSelection = chrome.emitSelectionChanged();
    const secondSelection = chrome.emitSelectionChanged();
    secondResponse.resolve(secondFacts);
    await secondSelection;
    firstResponse.resolve(DevtoolsProtocolFixtures.sourceAnalyzerResponse);
    await firstSelection;

    expect(chrome.sidebar.objects).toEqual([
      {
        object: sourcesSidebarModel(secondFacts),
        rootTitle: "Typed",
      },
    ]);
  });

  it("keeps Sources sidebar models protocol typed", () => {
    const model = sourcesSidebarModel(DevtoolsProtocolFixtures.sourceAnalyzerResponse);

    expectTypeOf(model).toExtend<SourcesSidebarModel>();
    expect(model).toMatchObject({
      _tag: "SourceFacts",
      facts: [
        {
          _tag: "ComponentDefinition",
          componentId: "cmp:app/root",
          deepLink: "typed://component/cmp%3Aapp%2Froot",
          displayName: "Root",
          sourceLocationId: "src:src/App.tsx:12:3",
          sourceLink: "typed://source/src%3Asrc%2FApp.tsx%3A12%3A3",
        },
      ],
      resource: "file:///workspace/src/App.tsx",
    });
  });
});

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function makeFakeSourcesChrome(runtime?: ReturnType<typeof makeFakeRuntime>) {
  let listener: (() => void | Promise<void>) | undefined;
  const sidebar = {
    objects: [] as { readonly object: unknown; readonly rootTitle?: string }[],
    page: "",
    setObject(object: unknown, rootTitle?: string) {
      this.objects.push({ object, rootTitle });
    },
    setPage(page: string) {
      this.page = page;
    },
  };
  return {
    sidebar,
    devtools: {
      panels: {
        sources: {
          createSidebarPane(_title: string, callback: (pane: typeof sidebar) => void) {
            callback(sidebar);
          },
          onSelectionChanged: {
            addListener(nextListener: () => void | Promise<void>) {
              listener = nextListener;
            },
          },
        },
      },
    },
    ...(runtime && { runtime }),
    async emitSelectionChanged() {
      await listener?.();
    },
  };
}

function makeFakeRuntime() {
  const listeners = new Set<(message: unknown) => void>();
  const messages: unknown[] = [];
  return {
    messages,
    connect() {
      return {
        disconnect: () => undefined,
        onDisconnect: {
          addListener: () => undefined,
          removeListener: () => undefined,
        },
        onMessage: {
          addListener: (listener: (message: unknown) => void) => listeners.add(listener),
          removeListener: (listener: (message: unknown) => void) => listeners.delete(listener),
        },
        postMessage: (message: unknown) => {
          messages.push(message);
          const request = message as { readonly id: number; readonly protocol: string };
          queueMicrotask(() => {
            for (const listener of listeners) {
              listener({
                id: request.id,
                protocol: request.protocol,
                success: DevtoolsProtocolFixtures.sourceAnalyzerResponse,
                tag: "AnalyzeSource",
              });
            }
          });
        },
      };
    },
  };
}
