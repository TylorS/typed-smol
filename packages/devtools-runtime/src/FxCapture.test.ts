import * as Cause from "effect/Cause";
import {
  makeDevtoolsSessionId,
  makeFxNodeId,
  type RuntimeEventEnvelope,
} from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import { makeDevtoolsRuntime, type DevtoolsRuntimeService } from "./Layer.js";
import { makeFxCapture, type FxCapture } from "./FxCapture.js";

const sessionId = makeDevtoolsSessionId("runtime-session");

describe("FxCapture", () => {
  it("serializes and redacts Fx lifecycle events before runtime emission", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const capture = makeFxCapture({
      now: nextTimestamp(10, 11, 12),
      runtime,
      serialization: { maxStringLength: 5 },
    });

    capture.observer.onStart?.({
      _tag: "Started",
      id: "load-user",
      ownerId: "cmp:user-card",
    });
    capture.observer.onEmit?.({
      _tag: "Emitted",
      id: "load-user",
      ownerId: "cmp:user-card",
      value: { name: "Adalovelace", token: "secret" },
    });
    capture.observer.onFailure?.({
      _tag: "Failed",
      cause: Cause.fail({ message: "denied", password: "secret" }),
      id: "load-user",
      ownerId: "cmp:user-card",
    });

    const events = runtime.snapshot();

    expect(events[0]).toEqual({
      _tag: "FxNodeEvent",
      fxNodeId: makeFxNodeId("cmp:user-card#load-user"),
      phase: "started",
      timestamp: 10,
    });
    expect(events[1]).toEqual({
      _tag: "FxNodeEvent",
      fxNodeId: makeFxNodeId("cmp:user-card#load-user"),
      phase: "emitted",
      timestamp: 11,
      value: {
        _tag: "Object",
        entries: [
          { key: "name", value: { _tag: "String", truncated: true, value: "Adalo" } },
          { key: "token", value: { _tag: "Redacted", reason: "key:token" } },
        ],
        truncated: false,
      },
    });
    expect(events[2]).toMatchObject({
      _tag: "FxNodeEvent",
      fxNodeId: makeFxNodeId("cmp:user-card#load-user"),
      phase: "failed",
      timestamp: 12,
    });
    expect(JSON.stringify(valueOf(events[2]))).toContain('"reason":"key:password"');
    expect(JSON.stringify(valueOf(events[2]))).not.toContain("secret");
    expect(JSON.parse(JSON.stringify(events))).toEqual(events);
  });

  it("uses stable RefSubject-derived and unowned ids without emitting unidentifiable Fx events", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const capture = makeFxCapture({ now: nextTimestamp(1, 2, 3, 4), runtime });

    capture.observer.onStart?.({
      _tag: "Started",
    });
    capture.observer.onStart?.({
      _tag: "Started",
      id: "updates",
      refSubjectId: "ref:counter",
    });
    capture.observer.onInterrupt?.({
      _tag: "Interrupted",
      cause: Cause.interrupt(1),
      id: "updates",
      refSubjectId: "ref:counter",
    });
    capture.observer.onComplete?.({
      _tag: "Completed",
      id: "poller",
    });

    expect(runtime.snapshot().map((event) => fxNodeIdOf(event))).toEqual([
      makeFxNodeId("ref:counter#updates"),
      makeFxNodeId("ref:counter#updates"),
      makeFxNodeId("poller"),
    ]);
    expect(runtime.snapshot().map((event) => phaseOf(event))).toEqual([
      "started",
      "interrupted",
      "completed",
    ]);
  });

  it("keeps Fx capture replay bounded through the runtime event bus", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, maxEvents: 2, sessionId });
    const capture = makeFxCapture({ now: nextTimestamp(1, 2, 3), runtime });

    capture.observer.onStart?.({ _tag: "Started", id: "poller" });
    capture.observer.onEmit?.({ _tag: "Emitted", id: "poller", value: 1 });
    capture.observer.onComplete?.({ _tag: "Completed", id: "poller" });

    expect(runtime.snapshot().map((event) => phaseOf(event))).toEqual(["emitted", "completed"]);
  });

  it("preserves public capture type inference", () => {
    const capture = makeFxCapture({
      runtime: makeDevtoolsRuntime({ enabled: true }),
    });

    expectTypeOf(capture).toExtend<FxCapture>();
    expectTypeOf(capture.runtime).toExtend<DevtoolsRuntimeService>();
  });
});

function nextTimestamp(...timestamps: readonly number[]): () => number {
  let index = 0;
  return () => timestamps[index++] ?? timestamps[timestamps.length - 1] ?? 0;
}

function fxNodeIdOf(event: RuntimeEventEnvelope) {
  if (event._tag !== "FxNodeEvent") throw new Error(`Expected FxNodeEvent, received ${event._tag}`);
  return event.fxNodeId;
}

function phaseOf(event: RuntimeEventEnvelope) {
  if (event._tag !== "FxNodeEvent") throw new Error(`Expected FxNodeEvent, received ${event._tag}`);
  return event.phase;
}

function valueOf(event: RuntimeEventEnvelope) {
  if (event._tag !== "FxNodeEvent") throw new Error(`Expected FxNodeEvent, received ${event._tag}`);
  return event.value;
}
