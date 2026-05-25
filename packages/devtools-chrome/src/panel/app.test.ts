// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { DevtoolsProtocolFixtures, makeDevtoolsClientId } from "@typed/devtools-protocol";
import { renderTypedDevtoolsPanel } from "./app.js";
import {
  TYPED_DEVTOOLS_RPC_EXPRESSION,
  type ChromeInspectedWindow,
} from "../transport/inspectedWindow.js";

describe("Typed DevTools panel app", () => {
  it("renders every protocol tab with fixture-backed data", async () => {
    const root = document.createElement("div");

    await renderTypedDevtoolsPanel(root);

    expect(root.querySelector('[data-testid="connection-status"]')?.textContent).toContain(
      "connected",
    );
    for (const title of [
      "Components",
      "Templates",
      "Fx",
      "RefSubjects",
      "HMR",
      "Navigation",
      "OTEL",
      "Sources",
    ]) {
      expect(root.textContent).toContain(title);
    }
    expect(root.textContent).toContain("Root");
    click(root, '[data-testid="tab-Templates"]');
    expect(root.textContent).toContain("sha256:root-template");
    click(root, '[data-testid="tab-Fx"]');
    expect(root.textContent).toContain("component/root/load-user");
    click(root, '[data-testid="tab-RefSubjects"]');
    expect(root.textContent).toContain("component/root/user");
    click(root, '[data-testid="tab-HMR"]');
    expect(root.textContent).toContain("module:/src/App.tsx");
    click(root, '[data-testid="tab-OTEL"]');
    expect(root.textContent).toContain("trace-root/span-root");
    click(root, '[data-testid="tab-Sources"]');
    expect(root.textContent).toContain("file:///workspace/src/App.tsx");
  });

  it("switches tabs instead of rendering placeholder sections at once", async () => {
    const root = document.createElement("div");

    await renderTypedDevtoolsPanel(root);

    expect(root.querySelector('[data-testid="panel-components"]')).not.toBeNull();
    expect(root.querySelector('[data-testid="panel-sources"]')).toBeNull();

    click(root, '[data-testid="tab-Sources"]');

    expect(root.querySelector('[data-testid="panel-components"]')).toBeNull();
    expect(root.querySelector('[data-testid="panel-sources"]')).not.toBeNull();
    expect(root.textContent).toContain("file:///workspace/src/App.tsx");
  });

  it("connects component rows to DOM inspection and source reveal actions", async () => {
    const root = document.createElement("div");
    const inspectDomBinding = vi.fn();
    const openSource = vi.fn();

    await renderTypedDevtoolsPanel(root, {
      actions: {
        inspectDomBinding,
        openSource,
      },
    });

    click(root, '[data-testid="component-action-dom-cmp-app-root"]');
    click(root, '[data-testid="component-action-source-cmp-app-root"]');

    expect(inspectDomBinding).toHaveBeenCalledWith(
      DevtoolsProtocolFixtures.domBindingResolution.bindingId,
    );
    expect(openSource).toHaveBeenCalledWith({
      column: 3,
      line: 12,
      resource: "file:///workspace/src/App.tsx",
    });
  });

  it("uses Chrome runtime RPC when the extension runtime is available", async () => {
    const root = document.createElement("div");
    const runtime = makeFakeRuntime();

    await renderTypedDevtoolsPanel(root, { runtime });

    expect(root.querySelector('[data-testid="connection-status"]')?.textContent).toContain(
      "runtime connected",
    );
    expect(runtime.messages.map((message) => message.tag)).toEqual([
      "Handshake",
      "AnalyzeSource",
      "ResolveDomBinding",
    ]);
    click(root, '[data-testid="tab-Sources"]');
    expect(root.textContent).toContain("file:///workspace/src/App.tsx");
  });

  it("prefers inspected-window RPC inside the real DevTools panel", async () => {
    const root = document.createElement("div");
    const runtime = makeFakeRuntime();
    const inspectedWindow = makeFakeInspectedWindowByExpression({
      [TYPED_DEVTOOLS_RPC_EXPRESSION("Handshake", panelHandshakeRequest())]:
        DevtoolsProtocolFixtures.handshakeResponse,
      [TYPED_DEVTOOLS_RPC_EXPRESSION(
        "AnalyzeSource",
        DevtoolsProtocolFixtures.sourceAnalyzerRequest,
      )]: DevtoolsProtocolFixtures.sourceAnalyzerResponse,
      [TYPED_DEVTOOLS_RPC_EXPRESSION(
        "ResolveDomBinding",
        DevtoolsProtocolFixtures.domBindingRequest,
      )]: DevtoolsProtocolFixtures.domBindingResolution,
    });

    await renderTypedDevtoolsPanel(root, { inspectedWindow, runtime });

    expect(root.querySelector('[data-testid="connection-status"]')?.textContent).toContain(
      "runtime connected",
    );
    expect(runtime.messages).toEqual([]);
    expect(inspectedWindow.expressions).toEqual([
      TYPED_DEVTOOLS_RPC_EXPRESSION("Handshake", panelHandshakeRequest()),
      TYPED_DEVTOOLS_RPC_EXPRESSION(
        "AnalyzeSource",
        DevtoolsProtocolFixtures.sourceAnalyzerRequest,
      ),
      TYPED_DEVTOOLS_RPC_EXPRESSION(
        "ResolveDomBinding",
        DevtoolsProtocolFixtures.domBindingRequest,
      ),
    ]);
  });
});

function click(root: Element, selector: string): void {
  const target = root.querySelector(selector);
  if (!(target instanceof HTMLElement)) throw new Error(`Missing ${selector}`);
  target.click();
}

function makeFakeRuntime() {
  const listeners = new Set<(message: unknown) => void>();
  return {
    messages: [] as { readonly id: number; readonly tag: string }[],
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
          const request = message as {
            readonly id: number;
            readonly protocol: string;
            readonly tag: string;
          };
          this.messages.push(request);
          queueMicrotask(() => {
            for (const listener of listeners) {
              listener({
                id: request.id,
                protocol: request.protocol,
                success:
                  request.tag === "Handshake"
                    ? {
                        acceptedCapabilities: ["components", "source-analyzer"],
                        peer: "inspected-runtime",
                        sessionId: "session:session-1",
                        unsupportedCapabilities: [],
                        version: "0.1.0",
                      }
                    : request.tag === "AnalyzeSource"
                      ? {
                          _tag: "SourceFacts",
                          facts: [],
                          requestedAt: 1,
                          resource: "file:///workspace/src/App.tsx",
                        }
                      : DevtoolsProtocolFixtures.domBindingResolution,
                tag: request.tag,
              });
            }
          });
        },
      };
    },
  };
}

function panelHandshakeRequest() {
  return {
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
    clientId: makeDevtoolsClientId("panel"),
    peer: "extension-panel",
    sessionId: DevtoolsProtocolFixtures.ids.session,
    version: "0.1.0",
  } as const;
}

function makeFakeInspectedWindowByExpression(
  results: Record<string, unknown>,
): ChromeInspectedWindow & { readonly expressions: string[] } {
  const expressions: string[] = [];
  return {
    expressions,
    eval(expression, callback) {
      expressions.push(expression);
      callback(results[expression]);
    },
  };
}
