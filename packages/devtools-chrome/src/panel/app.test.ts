// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { renderTypedDevtoolsPanel } from "./app.js";

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
    expect(root.textContent).toContain("sha256:root-template");
    expect(root.textContent).toContain("component/root/load-user");
    expect(root.textContent).toContain("component/root/user");
    expect(root.textContent).toContain("module:/src/App.tsx");
    expect(root.textContent).toContain("trace-root/span-root");
    expect(root.textContent).toContain("file:///workspace/src/App.tsx");
  });

  it("uses Chrome runtime RPC when the extension runtime is available", async () => {
    const root = document.createElement("div");
    const runtime = makeFakeRuntime();

    await renderTypedDevtoolsPanel(root, { runtime });

    expect(root.querySelector('[data-testid="connection-status"]')?.textContent).toContain(
      "runtime connected",
    );
    expect(runtime.messages.map((message) => message.tag)).toEqual(["Handshake", "AnalyzeSource"]);
    expect(root.textContent).toContain("file:///workspace/src/App.tsx");
  });
});

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
                    : {
                        _tag: "SourceFacts",
                        facts: [],
                        requestedAt: 1,
                        resource: "file:///workspace/src/App.tsx",
                      },
                tag: request.tag,
              });
            }
          });
        },
      };
    },
  };
}
