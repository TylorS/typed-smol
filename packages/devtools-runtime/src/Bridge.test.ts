import {
  DEVTOOLS_PROTOCOL_VERSION,
  makeComponentId,
  makeDevtoolsClientId,
  makeDevtoolsSessionId,
  makeDomBindingId,
  makeHmrBoundaryId,
  type RuntimeEventEnvelope,
  type RuntimeEventStreamItem,
  type SourceAnalyzerResponse,
} from "@typed/devtools-protocol";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  makeDevtoolsBridge,
  makeDevtoolsBridgeHandlers,
  type DevtoolsBridgeHandlers,
} from "./Bridge.js";
import { makeRuntimeEventBus } from "./EventBus.js";
import { makeDevtoolsRuntime } from "./Layer.js";

const sessionId = makeDevtoolsSessionId("runtime-session");

describe("DevTools runtime bridge", () => {
  it("negotiates handshake capabilities from the runtime side", async () => {
    const bridge = makeDevtoolsBridge({
      capabilities: ["components", "hmr", "source-analyzer"],
      eventBus: makeRuntimeEventBus({ enabled: true, sessionId }),
      sessionId,
    });

    const response = await Effect.runPromise(
      bridge.handshake({
        capabilities: ["components", "dom", "hmr", "source-analyzer"],
        clientId: makeDevtoolsClientId("panel"),
        peer: "extension-panel",
        sessionId,
        version: DEVTOOLS_PROTOCOL_VERSION,
      }),
    );

    expect(response).toEqual({
      acceptedCapabilities: ["components", "hmr", "source-analyzer"],
      peer: "inspected-runtime",
      sessionId,
      unsupportedCapabilities: ["dom"],
      version: DEVTOOLS_PROTOCOL_VERSION,
    });
  });

  it("streams capability-filtered replay events from the runtime event bus", async () => {
    const eventBus = makeRuntimeEventBus({ enabled: true, sessionId });
    const hmr = hmrStatus(2);
    eventBus.emit(componentUnmounted(1));
    eventBus.emit(hmr);
    const bridge = makeDevtoolsBridge({
      capabilities: ["components", "hmr"],
      eventBus,
      sessionId,
    });

    const events = await Effect.runPromise(
      bridge
        .subscribeRuntimeEvents({
          capabilities: ["hmr"],
          replay: true,
          sessionId,
          sinceSequence: 0,
        })
        .pipe(Stream.runCollect),
    );

    expect(events).toEqual([readyReplayState(3), hmr]);
  });

  it("streams events emitted through the runtime service bus", async () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const hmr = hmrStatus(2);
    runtime.emit(hmr);
    const bridge = makeDevtoolsBridge({
      capabilities: ["hmr"],
      runtime,
      sessionId,
    });

    const events = await Effect.runPromise(
      bridge
        .subscribeRuntimeEvents({
          capabilities: ["hmr"],
          replay: true,
          sessionId,
          sinceSequence: 0,
        })
        .pipe(Stream.runCollect),
    );

    expect(events).toEqual([readyReplayState(2), hmr]);
  });

  it("enforces the advertised bridge session when the bus has none", async () => {
    const eventBus = makeRuntimeEventBus({ enabled: true });
    eventBus.emit(componentUnmounted(1));
    const requestedSessionId = makeDevtoolsSessionId("other-session");
    const bridge = makeDevtoolsBridge({ eventBus, sessionId });

    const events = await Effect.runPromise(
      bridge
        .subscribeRuntimeEvents({
          capabilities: ["components"],
          replay: true,
          sessionId: requestedSessionId,
          sinceSequence: 0,
        })
        .pipe(Stream.runCollect),
    );

    expect(events).toEqual([
      {
        _tag: "RuntimeReplayState",
        state: {
          _tag: "SessionMismatch",
          droppedEvents: 0,
          nextSequence: 2,
          reconnectable: false,
          requestedSessionId,
          retainedEvents: 1,
          sessionId,
        },
      },
    ]);
  });

  it("enforces runtime service sessions even when the injected bus has none", async () => {
    const runtime = makeDevtoolsRuntime({
      enabled: true,
      eventBus: makeRuntimeEventBus({ enabled: true }),
      sessionId,
    });
    runtime.emit(componentUnmounted(1));
    const requestedSessionId = makeDevtoolsSessionId("other-session");
    const bridge = makeDevtoolsBridge({ runtime });

    const events = await Effect.runPromise(
      bridge
        .subscribeRuntimeEvents({
          capabilities: ["components"],
          replay: true,
          sessionId: requestedSessionId,
          sinceSequence: 0,
        })
        .pipe(Stream.runCollect),
    );

    expect(events).toEqual([
      {
        _tag: "RuntimeReplayState",
        state: {
          _tag: "SessionMismatch",
          droppedEvents: 0,
          nextSequence: 2,
          reconnectable: false,
          requestedSessionId,
          retainedEvents: 1,
          sessionId,
        },
      },
    ]);
  });

  it("rejects bridge options with conflicting bus and advertised sessions", () => {
    expect(() =>
      makeDevtoolsBridge({
        eventBus: makeRuntimeEventBus({
          enabled: true,
          sessionId: makeDevtoolsSessionId("bus-session"),
        }),
        sessionId,
      }),
    ).toThrow("DevTools bridge session must match the runtime event bus session");
  });

  it("returns host-neutral default unavailable bridge responses", async () => {
    const bridge = makeDevtoolsBridge({
      eventBus: makeRuntimeEventBus({ enabled: true, sessionId }),
      sessionId,
    });

    const dom = await Effect.runPromise(
      bridge.resolveDomBinding({
        bindingId: makeDomBindingId("missing"),
        includeRelated: true,
      }),
    );
    const analyzer = await Effect.runPromise(
      bridge.analyzeSource({
        requestedAt: 4,
        resource: "file:///workspace/src/App.tsx",
      }),
    );

    expect(dom).toEqual({
      _tag: "Unbound",
      bindingId: makeDomBindingId("missing"),
      reason: "DOM registry is not available",
    });
    expect(analyzer).toEqual({
      _tag: "Unavailable",
      reason: "Source analyzer bridge is not available",
      requestedAt: 4,
    });
  });

  it("supports custom host resolvers without duplicating protocol shapes", async () => {
    const unavailable = {
      _tag: "Unavailable",
      reason: "compiler bridge offline",
      requestedAt: 5,
    } as const satisfies SourceAnalyzerResponse;
    const bridge = makeDevtoolsBridge({
      analyzeSource: () => Effect.succeed(unavailable),
      eventBus: makeRuntimeEventBus({ enabled: true, sessionId }),
      sessionId,
    });

    await expect(
      Effect.runPromise(bridge.analyzeSource({ requestedAt: 5, resource: "file:///x.ts" })),
    ).resolves.toEqual(unavailable);
  });

  it("preserves handler type inference from the protocol group", () => {
    expectTypeOf(
      makeDevtoolsBridgeHandlers({
        eventBus: makeRuntimeEventBus({ enabled: true, sessionId }),
        sessionId,
      }),
    ).toExtend<DevtoolsBridgeHandlers>();
  });
});

function componentUnmounted(timestamp: number): RuntimeEventEnvelope {
  return {
    _tag: "ComponentUnmounted",
    componentId: makeComponentId("app/root"),
    timestamp,
  };
}

function hmrStatus(timestamp: number): RuntimeEventEnvelope {
  return {
    _tag: "HmrStatus",
    boundaryId: makeHmrBoundaryId("module:/src/App.tsx"),
    moduleId: "/src/App.tsx",
    stateful: { _tag: "Eligible", serviceIds: ["AppState"] },
    template: { optimized: true },
    timestamp,
  };
}

function readyReplayState(nextSequence: number): RuntimeEventStreamItem {
  return {
    _tag: "RuntimeReplayState",
    state: {
      _tag: "Ready",
      droppedEvents: 0,
      nextSequence,
      oldestRetainedSequence: 1,
      reconnectable: true,
      retainedEvents: nextSequence - 1,
      sessionId,
    },
  };
}
