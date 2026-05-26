import {
  DEVTOOLS_PROTOCOL_VERSION,
  makeDomBindingId,
  type DevtoolsCapability,
  type DevtoolsHandshakeRequest,
  type DevtoolsHandshakeResponse,
  type DomBindingRequest,
  type SourceAnalyzerRequest,
  type SourceAnalyzerResponse,
  type RuntimeEventSubscriptionRequest,
} from "@typed/devtools-protocol";
import type { DevtoolsRuntimeService, DomRegistry } from "@typed/devtools-runtime";
import * as Effect from "effect/Effect";

export interface TypedDevtoolsBridgeOptions {
  readonly domRegistry?: DomRegistry;
  readonly enabled: boolean;
  readonly globalObject?: Record<PropertyKey, unknown>;
  readonly runtime?: DevtoolsRuntimeService;
}

export function installTypedDevtoolsBridge(options: TypedDevtoolsBridgeOptions): void {
  const globalObject = options.globalObject ?? (globalThis as Record<PropertyKey, unknown>);
  if (!options.enabled || (!options.domRegistry && !options.runtime?.enabled)) {
    delete globalObject.__TYPED_DEVTOOLS__;
    return;
  }
  const domRegistry = options.domRegistry;
  const runtime = options.runtime?.enabled ? options.runtime : undefined;

  globalObject.__TYPED_DEVTOOLS__ = {
    analyzeSource: (request: SourceAnalyzerRequest) => analyzeSource(request),
    handshake: (request: DevtoolsHandshakeRequest) =>
      handshake(request, { domRegistry, runtime }),
    inspectDomBinding: (bindingId: string) =>
      inspectDomBinding(globalObject, domRegistry, bindingId),
    resolveDomBinding: (request: DomBindingRequest) =>
      domRegistry
        ? Effect.runSync(domRegistry.resolveDomBinding(request))
        : unboundDomBinding(request, "DOM registry is not available"),
    resolveSelectedElement: (node: Node) =>
      domRegistry
        ? domRegistry.resolveNode(node)
        : {
            _tag: "Unbound",
            bindingId: makeDomBindingId("selected-node"),
            reason: "DOM registry is not available",
          },
    subscribeRuntimeEvents: (request: RuntimeEventSubscriptionRequest) =>
      runtime ? runtimeEventStreamItems(runtime, request) : disabledRuntimeReplay(),
  };
}

const supportedCapabilities = [
  "dom",
] as const satisfies readonly DevtoolsCapability[];

function handshake(
  request: DevtoolsHandshakeRequest,
  options: {
    readonly domRegistry?: DomRegistry;
    readonly runtime?: DevtoolsRuntimeService;
  },
): DevtoolsHandshakeResponse {
  const capabilities = supportedCapabilitiesFor(options);
  return {
    acceptedCapabilities: request.capabilities.filter((capability) =>
      capabilities.includes(capability),
    ),
    peer: "inspected-runtime",
    sessionId: options.runtime?.sessionId ?? request.sessionId,
    unsupportedCapabilities: request.capabilities.filter(
      (capability) => !capabilities.includes(capability),
    ),
    version: DEVTOOLS_PROTOCOL_VERSION,
  };
}

function supportedCapabilitiesFor(options: {
  readonly domRegistry?: DomRegistry;
  readonly runtime?: DevtoolsRuntimeService;
}): readonly DevtoolsCapability[] {
  return [
    ...(options.runtime ? runtimeCapabilities : []),
    ...(options.domRegistry ? supportedCapabilities : []),
  ];
}

const runtimeCapabilities = [
  "components",
] as const satisfies readonly DevtoolsCapability[];

function analyzeSource(request: SourceAnalyzerRequest): SourceAnalyzerResponse {
  return {
    _tag: "Unavailable",
    reason: "Source analyzer bridge is not available",
    requestedAt: request.requestedAt,
  };
}

function inspectDomBinding(
  globalObject: Record<PropertyKey, unknown>,
  domRegistry: DomRegistry | undefined,
  bindingId: string,
):
  | { readonly _tag: "Inspected"; readonly bindingId: string }
  | {
      readonly _tag: "Unavailable";
      readonly bindingId: string;
      readonly reason: string;
    } {
  if (!domRegistry) {
    return { _tag: "Unavailable", bindingId, reason: "DOM registry is not available" };
  }
  const node = domRegistry.resolveBindingNode(makeDomBindingId(bindingId));
  if (!node) {
    return { _tag: "Unavailable", bindingId, reason: "DOM binding node is not mounted" };
  }

  const inspect = globalObject.inspect;
  if (typeof inspect !== "function") {
    return { _tag: "Unavailable", bindingId, reason: "Chrome inspect API is not available" };
  }

  inspect(node);
  return { _tag: "Inspected", bindingId };
}

function runtimeEventStreamItems(
  runtime: DevtoolsRuntimeService,
  request: RuntimeEventSubscriptionRequest,
) {
  const replay = runtime.eventBus.replay(request);
  return [{ _tag: "RuntimeReplayState", state: replay.state }, ...replay.events];
}

function disabledRuntimeReplay() {
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

function unboundDomBinding(request: DomBindingRequest, reason: string) {
  return { _tag: "Unbound", bindingId: request.bindingId, reason };
}
