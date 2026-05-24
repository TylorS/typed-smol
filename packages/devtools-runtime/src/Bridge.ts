import {
  DEVTOOLS_PROTOCOL_VERSION,
  TypedDevtoolsRpcGroup,
  type DevtoolsCapability,
  type DevtoolsHandshakeRequest,
  type DevtoolsHandshakeResponse,
  type DevtoolsSessionId,
  type DomBindingRequest,
  type DomBindingResolution,
  type RuntimeEventStreamItem,
  type RuntimeEventSubscriptionRequest,
  type RuntimeReplayState,
  type SourceAnalyzerRequest,
  type SourceAnalyzerResponse,
} from "@typed/devtools-protocol";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import { makeRuntimeEventBus, type RuntimeEventBus } from "./EventBus.js";
import type { DevtoolsRuntimeService } from "./Layer.js";

export type DevtoolsBridgeHandlers = ReturnType<typeof TypedDevtoolsRpcGroup.of>;

export interface DevtoolsBridge {
  readonly analyzeSource: (request: SourceAnalyzerRequest) => Effect.Effect<SourceAnalyzerResponse>;
  readonly handlers: DevtoolsBridgeHandlers;
  readonly handshake: (
    request: DevtoolsHandshakeRequest,
  ) => Effect.Effect<DevtoolsHandshakeResponse>;
  readonly resolveDomBinding: (request: DomBindingRequest) => Effect.Effect<DomBindingResolution>;
  readonly subscribeRuntimeEvents: (
    request: RuntimeEventSubscriptionRequest,
  ) => Stream.Stream<RuntimeEventStreamItem>;
}

export interface DevtoolsBridgeOptions {
  readonly analyzeSource?: (
    request: SourceAnalyzerRequest,
  ) => Effect.Effect<SourceAnalyzerResponse>;
  readonly capabilities?: readonly DevtoolsCapability[];
  readonly eventBus?: RuntimeEventBus;
  readonly resolveDomBinding?: (request: DomBindingRequest) => Effect.Effect<DomBindingResolution>;
  readonly runtime?: DevtoolsRuntimeService;
  readonly sessionId?: DevtoolsSessionId;
}

const DEFAULT_CAPABILITIES = [
  "components",
  "fx",
  "hmr",
  "navigation",
  "otel",
  "refsubjects",
] as const satisfies readonly DevtoolsCapability[];

export function makeDevtoolsBridgeHandlers(options: DevtoolsBridgeOptions): DevtoolsBridgeHandlers {
  return makeDevtoolsBridge(options).handlers;
}

export function makeDevtoolsBridge(options: DevtoolsBridgeOptions): DevtoolsBridge {
  const capabilities = [...(options.capabilities ?? DEFAULT_CAPABILITIES)];
  const eventBus = resolveEventBus(options);
  const sessionId = resolveSessionId(options, eventBus);
  const bridge = {
    analyzeSource: (request: SourceAnalyzerRequest) => analyzeSource(options, request),
    handshake: (request: DevtoolsHandshakeRequest) =>
      Effect.succeed({
        acceptedCapabilities: request.capabilities.filter((capability) =>
          capabilities.includes(capability),
        ),
        peer: "inspected-runtime",
        sessionId: sessionId ?? request.sessionId,
        unsupportedCapabilities: request.capabilities.filter(
          (capability) => !capabilities.includes(capability),
        ),
        version: DEVTOOLS_PROTOCOL_VERSION,
      } satisfies DevtoolsHandshakeResponse),
    resolveDomBinding: (request: DomBindingRequest) => resolveDomBinding(options, request),
    subscribeRuntimeEvents: (request: RuntimeEventSubscriptionRequest) =>
      Stream.fromIterable(runtimeEventStreamItems(eventBus, request, sessionId)),
  } satisfies Omit<DevtoolsBridge, "handlers">;

  return {
    ...bridge,
    handlers: TypedDevtoolsRpcGroup.of({
      AnalyzeSource: (request) => bridge.analyzeSource(request),
      Handshake: (request) => bridge.handshake(request),
      ResolveDomBinding: (request) => bridge.resolveDomBinding(request),
      SubscribeRuntimeEvents: (request) => bridge.subscribeRuntimeEvents(request),
    }),
  };
}

function resolveEventBus(options: DevtoolsBridgeOptions): RuntimeEventBus {
  return options.eventBus ?? options.runtime?.eventBus ?? makeRuntimeEventBus();
}

function resolveSessionId(
  options: DevtoolsBridgeOptions,
  eventBus: RuntimeEventBus,
): DevtoolsSessionId | undefined {
  const sessionId = options.sessionId ?? options.runtime?.sessionId ?? eventBus.sessionId;
  assertSessionAgreement(sessionId, options.runtime?.sessionId);
  assertSessionAgreement(sessionId, eventBus.sessionId);
  return sessionId;
}

function runtimeEventStreamItems(
  eventBus: RuntimeEventBus,
  request: RuntimeEventSubscriptionRequest,
  sessionId: DevtoolsSessionId | undefined,
): readonly RuntimeEventStreamItem[] {
  const replay = replayForBridgeSession(eventBus, request, sessionId);
  return [{ _tag: "RuntimeReplayState", state: replay.state }, ...replay.events];
}

function replayForBridgeSession(
  eventBus: RuntimeEventBus,
  request: RuntimeEventSubscriptionRequest,
  sessionId: DevtoolsSessionId | undefined,
) {
  if (sessionId !== undefined && request.sessionId !== sessionId) {
    const baseline = eventBus.replay({
      capabilities: [],
      replay: false,
      sessionId: eventBus.sessionId ?? sessionId,
      sinceSequence: request.sinceSequence,
    });
    return {
      events: [],
      state: sessionMismatchState(baseline.state, request.sessionId, sessionId),
    };
  }

  return eventBus.replay({
    ...request,
    ...(sessionId && { sessionId }),
  });
}

function sessionMismatchState(
  state: RuntimeReplayState,
  requestedSessionId: DevtoolsSessionId,
  sessionId: DevtoolsSessionId,
): RuntimeReplayState {
  return {
    _tag: "SessionMismatch",
    droppedEvents: state.droppedEvents,
    nextSequence: state.nextSequence,
    reconnectable: false,
    requestedSessionId,
    retainedEvents: state.retainedEvents,
    sessionId,
  };
}

function assertSessionAgreement(
  sessionId: DevtoolsSessionId | undefined,
  eventBusSessionId: DevtoolsSessionId | undefined,
): void {
  if (
    sessionId !== undefined &&
    eventBusSessionId !== undefined &&
    sessionId !== eventBusSessionId
  ) {
    throw new Error("DevTools bridge session must match the runtime event bus session");
  }
}

function resolveDomBinding(
  options: DevtoolsBridgeOptions,
  request: DomBindingRequest,
): Effect.Effect<DomBindingResolution> {
  return (
    options.resolveDomBinding?.(request) ??
    Effect.succeed({
      _tag: "Unbound",
      bindingId: request.bindingId,
      reason: "DOM registry is not available",
    })
  );
}

function analyzeSource(
  options: DevtoolsBridgeOptions,
  request: SourceAnalyzerRequest,
): Effect.Effect<SourceAnalyzerResponse> {
  return (
    options.analyzeSource?.(request) ??
    Effect.succeed({
      _tag: "Unavailable",
      reason: "Source analyzer bridge is not available",
      requestedAt: request.requestedAt,
    })
  );
}
