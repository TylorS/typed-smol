import { DevtoolsProtocolFixtures } from "@typed/devtools-protocol";
import {
  TYPED_DEVTOOLS_CHROME_PORT,
  TYPED_DEVTOOLS_CHROME_PROTOCOL,
  type ChromeRuntimeRpcRequest,
  type ChromeRuntimeRpcResponse,
} from "../transport/chromeRuntime.js";

declare const chrome:
  | {
      readonly runtime?: {
        readonly onConnect?: {
          readonly addListener: (listener: (port: ChromeRuntimePort) => void) => void;
        };
      };
    }
  | undefined;

interface ChromeRuntimePort {
  readonly name: string;
  readonly onMessage: {
    readonly addListener: (listener: (message: unknown) => void) => void;
  };
  readonly postMessage: (message: unknown) => void;
}

chrome?.runtime?.onConnect?.addListener((port) => {
  if (port.name !== TYPED_DEVTOOLS_CHROME_PORT) return;
  port.onMessage.addListener((message) => port.postMessage(responseFor(message)));
});

function responseFor(message: unknown): ChromeRuntimeRpcResponse {
  if (!isRequest(message)) {
    return {
      error: "Invalid Typed DevTools request",
      id: 0,
      protocol: TYPED_DEVTOOLS_CHROME_PROTOCOL,
      tag: "Handshake",
    };
  }

  return {
    id: message.id,
    protocol: TYPED_DEVTOOLS_CHROME_PROTOCOL,
    success: successFor(message),
    tag: message.tag,
  } as ChromeRuntimeRpcResponse;
}

function isRequest(message: unknown): message is ChromeRuntimeRpcRequest {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<ChromeRuntimeRpcRequest>;
  return candidate.protocol === TYPED_DEVTOOLS_CHROME_PROTOCOL && typeof candidate.id === "number";
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
      return DevtoolsProtocolFixtures.runtimeStreamItems[0];
  }
}
