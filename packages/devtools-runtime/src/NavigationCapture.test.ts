import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import {
  makeDevtoolsSessionId,
  makeNavigationEventId,
  type RuntimeEventEnvelope,
} from "@typed/devtools-protocol";
import type { Destination, NavigationEvent } from "@typed/navigation";
import { describe, expect, expectTypeOf, it } from "vitest";
import { makeDevtoolsBridge } from "./Bridge.js";
import { makeDevtoolsRuntime, type DevtoolsRuntimeService } from "./Layer.js";
import { makeNavigationCapture, type NavigationCapture } from "./NavigationCapture.js";

const sessionId = makeDevtoolsSessionId("runtime-session");

describe("NavigationCapture", () => {
  it("converts typed Navigation events into protocol runtime events", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const capture = makeNavigationCapture({
      now: nextTimestamp(100),
      runtime,
    });

    Effect.runSync(capture.handler(navigationEvent("push", "entry-2", "http://localhost/2")));

    expect(runtime.snapshot()).toEqual([
      {
        _tag: "NavigationEvent",
        navigationEventId: makeNavigationEventId("push:entry-2"),
        timestamp: 100,
        to: "http://localhost/2",
        type: "push",
      },
    ]);
  });

  it("reuses runtime EventBus retention and HMR-independent navigation capability filtering", async () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, maxEvents: 2, sessionId });
    const capture = makeNavigationCapture({ now: nextTimestamp(1, 2, 3), runtime });

    capture.emit(navigationEvent("push", "entry-1", "http://localhost/1"));
    capture.emit(navigationEvent("replace", "entry-2", "http://localhost/2"));
    capture.emit(navigationEvent("reload", "entry-2", "http://localhost/2"));

    expect(runtime.snapshot().map((event) => navigationIdOf(event))).toEqual([
      makeNavigationEventId("replace:entry-2"),
      makeNavigationEventId("reload:entry-2"),
    ]);

    const bridge = makeDevtoolsBridge({ capabilities: ["navigation"], runtime, sessionId });
    const replay = await Effect.runPromise(
      bridge
        .subscribeRuntimeEvents({
          capabilities: ["navigation"],
          replay: true,
          sessionId,
        })
        .pipe(Stream.runCollect),
    );

    expect(
      replay.map((event) => (event._tag === "NavigationEvent" ? event.type : event._tag)),
    ).toEqual(["RuntimeReplayState", "replace", "reload"]);
  });

  it("supports caller-provided navigation event ids", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const capture = makeNavigationCapture({
      now: nextTimestamp(1),
      resolveId: (event) => makeNavigationEventId(`route:${event.destination.key}`),
      runtime,
    });

    capture.emit(navigationEvent("traverse", "entry-1", "http://localhost/1", "route-key"));

    expect(runtime.snapshot().map((event) => navigationIdOf(event))).toEqual([
      makeNavigationEventId("route:route-key"),
    ]);
  });

  it("isolates diagnostic capture failures from navigation handlers", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const capture = makeNavigationCapture({
      now() {
        throw new Error("clock failed");
      },
      resolveId() {
        throw new Error("resolver failed");
      },
      runtime,
    });

    const result = Effect.runSync(
      capture.handler(navigationEvent("push", "entry-2", "http://localhost/2")),
    );
    const throwingRuntime: DevtoolsRuntimeService = {
      ...runtime,
      emit() {
        throw new Error("runtime emit failed");
      },
    };
    const runtimeCapture = makeNavigationCapture({
      runtime: throwingRuntime,
    });
    const runtimeResult = Effect.runSync(
      runtimeCapture.handler(navigationEvent("push", "entry-3", "http://localhost/3")),
    );

    expect(result._tag).toBe("None");
    expect(runtimeResult._tag).toBe("None");
    expect(runtime.snapshot()).toEqual([]);
  });

  it("preserves public capture type inference", () => {
    const capture = makeNavigationCapture({
      runtime: makeDevtoolsRuntime({ enabled: true }),
    });

    expectTypeOf(capture).toExtend<NavigationCapture>();
    expectTypeOf(capture.runtime).toExtend<DevtoolsRuntimeService>();
  });
});

function navigationEvent(
  type: NavigationEvent["type"],
  id: string,
  href: string,
  key = id,
): NavigationEvent {
  return {
    type,
    destination: destination(id, href, key),
    info: undefined,
  };
}

function destination(id: string, href: string, key: string): Destination {
  const url = new URL(href);
  return {
    id,
    key,
    sameDocument: url.origin === "http://localhost",
    state: undefined,
    url,
  };
}

function nextTimestamp(...timestamps: readonly number[]): () => number {
  let index = 0;
  return () => timestamps[index++] ?? timestamps[timestamps.length - 1] ?? 0;
}

function navigationIdOf(event: RuntimeEventEnvelope) {
  if (event._tag !== "NavigationEvent") {
    throw new Error(`Expected NavigationEvent, received ${event._tag}`);
  }

  return event.navigationEventId;
}
