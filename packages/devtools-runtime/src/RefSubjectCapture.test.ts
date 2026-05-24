import {
  makeDevtoolsSessionId,
  makeRefSubjectId,
  type RuntimeEventEnvelope,
} from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import { makeDevtoolsRuntime, type DevtoolsRuntimeService } from "./Layer.js";
import { makeRefSubjectCapture, type RefSubjectCapture } from "./RefSubjectCapture.js";

const sessionId = makeDevtoolsSessionId("runtime-session");

describe("RefSubjectCapture", () => {
  it("serializes and redacts RefSubject snapshots and updates before runtime emission", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const capture = makeRefSubjectCapture({
      now: nextTimestamp(100, 101),
      runtime,
      serialization: { maxStringLength: 5 },
    });

    capture.observer.onSnapshot?.({
      _tag: "Snapshot",
      id: "user-session",
      subscriberCount: 2,
      value: { name: "Adalovelace", token: "secret" },
      version: 0,
    });
    capture.observer.onUpdate?.({
      _tag: "Updated",
      id: "user-session",
      subscriberCount: 2,
      value: { count: 1, password: "secret" },
      version: 1,
    });

    const events = runtime.snapshot();

    expect(events).toEqual([
      {
        _tag: "RefSubjectSnapshot",
        refSubjectId: makeRefSubjectId("user-session"),
        subscriberCount: 2,
        timestamp: 100,
        value: {
          _tag: "Object",
          entries: [
            { key: "name", value: { _tag: "String", truncated: true, value: "Adalo" } },
            { key: "token", value: { _tag: "Redacted", reason: "key:token" } },
          ],
          truncated: false,
        },
        version: 0,
      },
      {
        _tag: "RefSubjectUpdated",
        refSubjectId: makeRefSubjectId("user-session"),
        timestamp: 101,
        value: {
          _tag: "Object",
          entries: [
            { key: "count", value: { _tag: "Number", value: 1 } },
            { key: "password", value: { _tag: "Redacted", reason: "key:password" } },
          ],
          truncated: false,
        },
        version: 1,
      },
    ]);
    expect(JSON.parse(JSON.stringify(events))).toEqual(events);
  });

  it("uses stable service and owner-qualified ids without emitting unidentifiable refs", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const capture = makeRefSubjectCapture({ now: nextTimestamp(1, 2, 3), runtime });

    capture.observer.onSnapshot?.({
      _tag: "Snapshot",
      subscriberCount: 0,
      value: "anonymous",
      version: 0,
    });
    capture.observer.onSnapshot?.({
      _tag: "Snapshot",
      id: "label",
      serviceId: "CounterService",
      subscriberCount: 1,
      value: 0,
      version: 0,
    });
    capture.observer.onUpdate?.({
      _tag: "Updated",
      id: "local-count",
      ownerId: "cmp:app/root",
      subscriberCount: 1,
      value: 1,
      version: 1,
    });

    expect(runtime.snapshot().map((event) => refSubjectIdOf(event))).toEqual([
      makeRefSubjectId("CounterService"),
      makeRefSubjectId("cmp:app/root#local-count"),
    ]);
  });

  it("keeps RefSubject capture replay bounded through the runtime event bus", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, maxEvents: 2, sessionId });
    const capture = makeRefSubjectCapture({ now: nextTimestamp(1, 2, 3), runtime });

    capture.observer.onSnapshot?.({
      _tag: "Snapshot",
      id: "counter",
      subscriberCount: 0,
      value: 0,
      version: 0,
    });
    capture.observer.onUpdate?.({
      _tag: "Updated",
      id: "counter",
      subscriberCount: 0,
      value: 1,
      version: 1,
    });
    capture.observer.onUpdate?.({
      _tag: "Updated",
      id: "counter",
      subscriberCount: 0,
      value: 2,
      version: 2,
    });

    expect(runtime.snapshot().map((event) => refSubjectVersionOf(event))).toEqual([1, 2]);
  });

  it("preserves public capture type inference", () => {
    const capture = makeRefSubjectCapture({
      runtime: makeDevtoolsRuntime({ enabled: true }),
    });

    expectTypeOf(capture).toExtend<RefSubjectCapture>();
    expectTypeOf(capture.runtime).toExtend<DevtoolsRuntimeService>();
  });
});

function nextTimestamp(...timestamps: readonly number[]): () => number {
  let index = 0;
  return () => timestamps[index++] ?? timestamps[timestamps.length - 1] ?? 0;
}

function refSubjectIdOf(event: RuntimeEventEnvelope) {
  if (event._tag !== "RefSubjectSnapshot" && event._tag !== "RefSubjectUpdated") {
    throw new Error(`Expected RefSubject event, received ${event._tag}`);
  }

  return event.refSubjectId;
}

function refSubjectVersionOf(event: RuntimeEventEnvelope) {
  if (event._tag !== "RefSubjectSnapshot" && event._tag !== "RefSubjectUpdated") {
    throw new Error(`Expected RefSubject event, received ${event._tag}`);
  }

  return event.version;
}
