import {
  DEVTOOLS_PROTOCOL_VERSION,
  makeDevtoolsSessionId,
  makeDomBindingId,
  type DevtoolsCapability,
  type DevtoolsSessionId,
  type DomBindingId,
} from "@typed/devtools-protocol";
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
  return (
    candidate.protocol === TYPED_DEVTOOLS_CHROME_PROTOCOL &&
    typeof candidate.id === "number" &&
    isTypedDevtoolsRpcTag(candidate.tag)
  );
}

function successFor(request: ChromeRuntimeRpcRequest): unknown {
  switch (request.tag) {
    case "AnalyzeSource":
      return {
        _tag: "Unavailable",
        reason: "Typed DevTools inspected-page bridge is not connected",
        requestedAt: requestedAtOf(request.payload),
      };
    case "Handshake":
      return {
        acceptedCapabilities: [],
        peer: "inspected-runtime",
        sessionId: sessionIdOf(request.payload),
        unsupportedCapabilities: capabilitiesOf(request.payload),
        version: DEVTOOLS_PROTOCOL_VERSION,
      };
    case "ResolveDomBinding":
      return {
        _tag: "Unbound",
        bindingId: bindingIdOf(request.payload),
        reason: "Typed DevTools inspected-page bridge is not connected",
      };
    case "SubscribeRuntimeEvents":
      return {
        _tag: "RuntimeReplayState",
        state: {
          _tag: "Disabled",
          droppedEvents: 0,
          nextSequence: 0,
          reconnectable: false,
          retainedEvents: 0,
        },
      };
  }
}

function capabilitiesOf(payload: unknown): readonly DevtoolsCapability[] {
  if (!payload || typeof payload !== "object") return [];
  const capabilities = (payload as { readonly capabilities?: unknown }).capabilities;
  return Array.isArray(capabilities) ? capabilities.filter(isDevtoolsCapability) : [];
}

function sessionIdOf(payload: unknown): DevtoolsSessionId {
  if (!payload || typeof payload !== "object") return makeDevtoolsSessionId("unavailable");
  const sessionId = (payload as { readonly sessionId?: unknown }).sessionId;
  return typeof sessionId === "string"
    ? makeDevtoolsSessionId(sessionId)
    : makeDevtoolsSessionId("unavailable");
}

function requestedAtOf(payload: unknown): number {
  if (!payload || typeof payload !== "object") return 0;
  const requestedAt = (payload as { readonly requestedAt?: unknown }).requestedAt;
  return typeof requestedAt === "number" && Number.isFinite(requestedAt) ? requestedAt : 0;
}

function bindingIdOf(payload: unknown): DomBindingId {
  if (!payload || typeof payload !== "object") return makeDomBindingId("unavailable");
  const bindingId = (payload as { readonly bindingId?: unknown }).bindingId;
  return typeof bindingId === "string"
    ? makeDomBindingId(bindingId)
    : makeDomBindingId("unavailable");
}

function isDevtoolsCapability(value: unknown): value is DevtoolsCapability {
  return (
    value === "components" ||
    value === "dom" ||
    value === "fx" ||
    value === "hmr" ||
    value === "navigation" ||
    value === "otel" ||
    value === "refsubjects" ||
    value === "source-analyzer"
  );
}

function isTypedDevtoolsRpcTag(value: unknown): value is ChromeRuntimeRpcRequest["tag"] {
  return (
    value === "AnalyzeSource" ||
    value === "Handshake" ||
    value === "ResolveDomBinding" ||
    value === "SubscribeRuntimeEvents"
  );
}
