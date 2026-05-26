import {
  DEVTOOLS_PROTOCOL_VERSION,
  DevtoolsProtocolFixtures,
  type DevtoolsHandshakeRequest,
  type DevtoolsHandshakeResponse,
} from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import { registerTypedDevtoolsPage } from "../devtoolsPage.js";
import { makeTypedDevtoolsManifest } from "../manifest.js";
import {
  TYPED_DEVTOOLS_CHROME_PORT,
  makeChromeRuntimeRpcClient,
  type ChromeRuntimeRpcRequest,
} from "./chromeRuntime.js";

describe("Chrome DevTools package shell", () => {
  it("creates a Manifest V3 DevTools extension manifest", () => {
    expect(makeTypedDevtoolsManifest()).toEqual({
      description: "Typed framework DevTools",
      devtools_page: "devtools.html",
      manifest_version: 3,
      name: "Typed DevTools",
      version: "1.0.0-beta.4",
    });
  });

  it("registers the DevTools panel through chrome.devtools.panels", () => {
    const created: unknown[] = [];
    registerTypedDevtoolsPage({
      devtools: {
        panels: {
          create: (title, iconPath, pagePath) => created.push({ iconPath, pagePath, title }),
        },
      },
    });

    expect(created).toEqual([
      {
        iconPath: "icons/typed-devtools-32.png",
        pagePath: "panel.html",
        title: "Typed",
      },
    ]);
  });
});

describe("Chrome runtime RPC transport", () => {
  it("sends protocol-owned RPC tags and payloads through a Chrome runtime port", async () => {
    const runtime = makeFakeRuntime((request) => {
      expect(request).toMatchObject({
        id: 1,
        payload: DevtoolsProtocolFixtures.handshakeRequest,
        protocol: "typed-devtools",
        tag: "Handshake",
      });
      return DevtoolsProtocolFixtures.handshakeResponse;
    });
    const client = makeChromeRuntimeRpcClient(runtime);

    const response = await client.request("Handshake", DevtoolsProtocolFixtures.handshakeRequest);

    expect(runtime.connectedNames).toEqual([TYPED_DEVTOOLS_CHROME_PORT]);
    expect(response).toEqual(DevtoolsProtocolFixtures.handshakeResponse);
    expectTypeOf(response).toEqualTypeOf<DevtoolsHandshakeResponse>();
  });

  it("ignores wrong-tag and incomplete responses for a pending request", async () => {
    const runtime = makeFakeRuntime((request) => [
      {
        id: request.id,
        protocol: request.protocol,
        success: DevtoolsProtocolFixtures.sourceAnalyzerResponse,
        tag: "AnalyzeSource",
      },
      {
        id: request.id,
        protocol: request.protocol,
        tag: "Handshake",
      },
      {
        id: request.id,
        protocol: request.protocol,
        success: DevtoolsProtocolFixtures.handshakeResponse,
        tag: "Handshake",
      },
    ]);
    const client = makeChromeRuntimeRpcClient(runtime);

    await expect(
      client.request("Handshake", DevtoolsProtocolFixtures.handshakeRequest),
    ).resolves.toEqual(DevtoolsProtocolFixtures.handshakeResponse);
  });

  it("rejects malformed runtime responses before they reach the panel", async () => {
    const runtime = makeFakeRuntime((request) => [
      {
        id: request.id,
        protocol: request.protocol,
        success: { acceptedCapabilities: ["browser-only"] },
        tag: "Handshake",
      },
    ]);
    const client = makeChromeRuntimeRpcClient(runtime);

    await expect(
      client.request("Handshake", DevtoolsProtocolFixtures.handshakeRequest),
    ).rejects.toThrow("invalid Typed DevTools RPC response");
  });

  it("removes pending requests when postMessage throws synchronously", async () => {
    const client = makeChromeRuntimeRpcClient(makeThrowingRuntime());

    await expect(
      client.request("Handshake", DevtoolsProtocolFixtures.handshakeRequest),
    ).rejects.toThrow("postMessage failed");
    client.disconnect();
  });

  it("keeps protocol payload inference at the transport boundary", () => {
    expectTypeOf<
      ChromeRuntimeRpcRequest<"Handshake">["payload"]
    >().toExtend<DevtoolsHandshakeRequest>();
  });

  it("supports manifest version constants from the protocol package", () => {
    expect(makeTypedDevtoolsManifest({ version: DEVTOOLS_PROTOCOL_VERSION }).version).toBe(
      DEVTOOLS_PROTOCOL_VERSION,
    );
  });
});

function makeFakeRuntime(
  respond: (
    request: ChromeRuntimeRpcRequest,
  ) => DevtoolsHandshakeResponse | readonly Record<string, unknown>[],
) {
  const listeners = new Set<(message: unknown) => void>();
  const connectedNames: string[] = [];
  return {
    connectedNames,
    connect(options?: { readonly name?: string }) {
      connectedNames.push(options?.name ?? "");
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
          const request = message as ChromeRuntimeRpcRequest;
          queueMicrotask(() => {
            const response = respond(request);
            const messages = Array.isArray(response)
              ? response
              : [
                  {
                    id: request.id,
                    protocol: request.protocol,
                    success: response,
                    tag: request.tag,
                  },
                ];
            for (const message of messages) {
              for (const listener of listeners) {
                listener(message);
              }
            }
          });
        },
      };
    },
  };
}

function makeThrowingRuntime() {
  return {
    connectedNames: [] as string[],
    connect(options?: { readonly name?: string }) {
      this.connectedNames.push(options?.name ?? "");
      return {
        disconnect: () => undefined,
        onDisconnect: {
          addListener: () => undefined,
          removeListener: () => undefined,
        },
        onMessage: {
          addListener: () => undefined,
          removeListener: () => undefined,
        },
        postMessage: () => {
          throw new Error("postMessage failed");
        },
      };
    },
  };
}
