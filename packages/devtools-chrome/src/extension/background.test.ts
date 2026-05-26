import { DevtoolsProtocolFixtures } from "@typed/devtools-protocol";
import { describe, expect, it } from "vitest";
import {
  TYPED_DEVTOOLS_CHROME_PORT,
  TYPED_DEVTOOLS_CHROME_PROTOCOL,
  type ChromeRuntimeRpcRequest,
} from "../transport/chromeRuntime.js";

describe("Chrome extension background RPC", () => {
  it("returns unavailable defaults instead of fixture-backed runtime data", async () => {
    const chrome = makeFakeChrome();
    (globalThis as { chrome?: unknown }).chrome = chrome;

    await import("./background.js");

    const port = makeFakePort();
    chrome.connect(port);
    port.emit(
      request(1, "Handshake", {
        ...DevtoolsProtocolFixtures.handshakeRequest,
        capabilities: ["components", "dom", "fx", "source-analyzer"],
      }),
    );
    port.emit(request(2, "AnalyzeSource", DevtoolsProtocolFixtures.sourceAnalyzerRequest));
    port.emit(request(3, "ResolveDomBinding", DevtoolsProtocolFixtures.domBindingRequest));
    port.emit(
      request(4, "SubscribeRuntimeEvents", DevtoolsProtocolFixtures.runtimeSubscriptionRequest),
    );
    port.emit({
      id: 5,
      payload: {},
      protocol: TYPED_DEVTOOLS_CHROME_PROTOCOL,
      tag: "Unknown",
    });

    expect(port.responses.map((response) => response.success)).toEqual([
      {
        acceptedCapabilities: [],
        peer: "inspected-runtime",
        sessionId: DevtoolsProtocolFixtures.ids.session,
        unsupportedCapabilities: ["components", "dom", "fx", "source-analyzer"],
        version: "0.1.0",
      },
      {
        _tag: "Unavailable",
        reason: "Typed DevTools inspected-page bridge is not connected",
        requestedAt: DevtoolsProtocolFixtures.sourceAnalyzerRequest.requestedAt,
      },
      {
        _tag: "Unbound",
        bindingId: DevtoolsProtocolFixtures.domBindingRequest.bindingId,
        reason: "Typed DevTools inspected-page bridge is not connected",
      },
      {
        _tag: "RuntimeReplayState",
        state: {
          _tag: "Disabled",
          droppedEvents: 0,
          nextSequence: 0,
          reconnectable: false,
          retainedEvents: 0,
        },
      },
      undefined,
    ]);
    expect(port.responses[4]).toMatchObject({
      error: "Invalid Typed DevTools request",
      id: 0,
      protocol: TYPED_DEVTOOLS_CHROME_PROTOCOL,
      tag: "Handshake",
    });
  });
});

function makeFakeChrome() {
  let listener: ((port: ReturnType<typeof makeFakePort>) => void) | undefined;
  return {
    connect(port: ReturnType<typeof makeFakePort>) {
      listener?.(port);
    },
    runtime: {
      onConnect: {
        addListener(next: (port: ReturnType<typeof makeFakePort>) => void) {
          listener = next;
        },
      },
    },
  };
}

function makeFakePort() {
  let listener: ((message: unknown) => void) | undefined;
  return {
    name: TYPED_DEVTOOLS_CHROME_PORT,
    responses: [] as Array<{ readonly error?: unknown; readonly success?: unknown }>,
    emit(message: unknown) {
      listener?.(message);
    },
    onMessage: {
      addListener(next: (message: unknown) => void) {
        listener = next;
      },
    },
    postMessage(message: { readonly success: unknown }) {
      this.responses.push(message);
    },
  };
}

function request(
  id: number,
  tag: ChromeRuntimeRpcRequest["tag"],
  payload: unknown,
): ChromeRuntimeRpcRequest {
  return {
    id,
    payload,
    protocol: TYPED_DEVTOOLS_CHROME_PROTOCOL,
    tag,
  } as ChromeRuntimeRpcRequest;
}
