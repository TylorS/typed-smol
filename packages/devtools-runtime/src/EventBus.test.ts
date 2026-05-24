import {
  makeComponentId,
  makeDevtoolsSessionId,
  makeFxNodeId,
  makeHmrBoundaryId,
  makeRefSubjectId,
  serializeDevtoolsValue,
  type RuntimeEventEnvelope,
} from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import { makeRuntimeEventBus, type RuntimeEventBus, type RuntimeEventReplay } from "./EventBus.js";

const sessionId = makeDevtoolsSessionId("runtime-session");

describe("Runtime EventBus", () => {
  it("keeps bounded replay with explicit partial reconnect state", () => {
    const bus = makeRuntimeEventBus({ enabled: true, maxEvents: 2, sessionId });
    const hmr = hmrStatus(2);
    const fx = fxNodeEvent(3);

    bus.emit(componentUnmounted(1));
    bus.emit(hmr);
    bus.emit(fx);

    const replay = bus.replay({
      capabilities: ["hmr", "fx"],
      replay: true,
      sessionId,
      sinceSequence: 0,
    });

    expect(replay).toEqual({
      events: [hmr, fx],
      state: {
        _tag: "Partial",
        droppedEvents: 1,
        nextSequence: 4,
        oldestRetainedSequence: 2,
        reason: "retention-limit-exceeded",
        reconnectable: true,
        retainedEvents: 2,
        sessionId,
      },
    });
    expect(JSON.parse(JSON.stringify(replay))).toEqual(replay);
  });

  it("returns disabled replay state and captures nothing by default", () => {
    const bus = makeRuntimeEventBus();

    bus.emit(componentUnmounted(1));

    expect(bus.replay({ capabilities: ["components"], replay: true, sessionId })).toEqual({
      events: [],
      state: {
        _tag: "Disabled",
        droppedEvents: 0,
        nextSequence: 1,
        reconnectable: false,
        retainedEvents: 0,
      },
    });
  });

  it("reports session mismatch without leaking retained events", () => {
    const bus = makeRuntimeEventBus({ enabled: true, sessionId });
    const requestedSessionId = makeDevtoolsSessionId("other-session");

    bus.emit(componentUnmounted(1));

    expect(
      bus.replay({ capabilities: ["components"], replay: true, sessionId: requestedSessionId }),
    ).toEqual({
      events: [],
      state: {
        _tag: "SessionMismatch",
        droppedEvents: 0,
        nextSequence: 2,
        reconnectable: false,
        requestedSessionId,
        retainedEvents: 1,
        sessionId,
      },
    });
  });

  it("uses sequence cursors instead of timestamps for replay", () => {
    const bus = makeRuntimeEventBus({ enabled: true, maxEvents: 3, sessionId });
    const first = componentUnmounted(1);
    const second = hmrStatus(1);
    const third = fxNodeEvent(1);

    bus.emit(first);
    bus.emit(second);
    bus.emit(third);

    expect(
      bus.replay({
        capabilities: ["components", "hmr", "fx"],
        replay: true,
        sessionId,
        sinceSequence: 1,
      }),
    ).toEqual({
      events: [second, third],
      state: {
        _tag: "Ready",
        droppedEvents: 0,
        nextSequence: 4,
        oldestRetainedSequence: 1,
        reconnectable: true,
        retainedEvents: 3,
        sessionId,
      },
    });
  });

  it("clones emitted and replayed events", () => {
    const bus = makeRuntimeEventBus({ enabled: true, sessionId });
    const event: RuntimeEventEnvelope & {
      component: { displayName: string };
    } = {
      _tag: "ComponentMounted",
      component: {
        componentId: makeComponentId("app/root"),
        displayName: "Root",
        fxNodeIds: [],
        refSubjectIds: [makeRefSubjectId("app/root/state")],
      },
      timestamp: 1,
    };

    bus.emit(event);
    event.component.displayName = "Mutated";
    const replay = bus.replay({ capabilities: ["components"], replay: true, sessionId });
    const [mounted] = replay.events;
    if (mounted?._tag !== "ComponentMounted") throw new Error("expected component event");
    const mutableMounted = mounted as RuntimeEventEnvelope & {
      component: { displayName: string };
    };
    mutableMounted.component.displayName = "Changed by consumer";

    expect(bus.replay({ capabilities: ["components"], replay: true, sessionId }).events).toEqual([
      {
        _tag: "ComponentMounted",
        component: {
          componentId: makeComponentId("app/root"),
          displayName: "Root",
          fxNodeIds: [],
          refSubjectIds: [makeRefSubjectId("app/root/state")],
        },
        timestamp: 1,
      },
    ]);
  });

  it("preserves public type inference", () => {
    expectTypeOf(makeRuntimeEventBus({ enabled: true })).toExtend<RuntimeEventBus>();
    expectTypeOf(
      makeRuntimeEventBus({ enabled: true }).replay({
        capabilities: ["components"],
        replay: true,
        sessionId,
      }),
    ).toExtend<RuntimeEventReplay>();
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

function fxNodeEvent(timestamp: number): RuntimeEventEnvelope {
  return {
    _tag: "FxNodeEvent",
    fxNodeId: makeFxNodeId("app/root/load"),
    phase: "emitted",
    timestamp,
    value: serializeDevtoolsValue({ ok: true }),
  };
}
