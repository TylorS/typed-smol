import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import {
  makeComponentId,
  makeDevtoolsSessionId,
  makeFxNodeId,
  type RuntimeEventEnvelope,
} from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import { makeDevtoolsBridge } from "./Bridge.js";
import { makeDevtoolsRuntime, type DevtoolsRuntimeService } from "./Layer.js";
import { makeOtelCorrelation, type OtelCorrelation } from "./OtelCorrelation.js";

const sessionId = makeDevtoolsSessionId("runtime-session");

describe("OtelCorrelation", () => {
  it("preserves OTEL trace and span ids while adding Typed correlation ids", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const correlation = makeOtelCorrelation({ runtime });

    correlation.emit({
      name: "render Counter",
      spanId: "0123456789abcdef",
      traceId: "0123456789abcdef0123456789abcdef",
      typedIds: [makeComponentId("src/Counter.ts#Counter"), makeFxNodeId("counter#render")],
    });

    expect(runtime.snapshot()).toEqual([
      {
        _tag: "OtelSpan",
        name: "render Counter",
        spanId: "0123456789abcdef",
        traceId: "0123456789abcdef0123456789abcdef",
        typedIds: [makeComponentId("src/Counter.ts#Counter"), makeFxNodeId("counter#render")],
      },
    ]);
  });

  it("defaults Typed correlation metadata to an empty additive list", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const correlation = makeOtelCorrelation({ runtime });

    correlation.emit({
      name: "http request",
      spanId: "span-1",
      traceId: "trace-1",
    });

    expect(runtime.snapshot()).toEqual([
      {
        _tag: "OtelSpan",
        name: "http request",
        spanId: "span-1",
        traceId: "trace-1",
        typedIds: [],
      },
    ]);
  });

  it("reuses runtime EventBus retention and OTEL capability filtering", async () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, maxEvents: 2, sessionId });
    const correlation = makeOtelCorrelation({ runtime });

    correlation.emit(otelSpan("one", "trace-1", "span-1"));
    correlation.emit(otelSpan("two", "trace-1", "span-2"));
    correlation.emit(otelSpan("three", "trace-1", "span-3"));

    expect(runtime.snapshot().map((event) => spanNameOf(event))).toEqual(["two", "three"]);

    const bridge = makeDevtoolsBridge({ capabilities: ["otel"], runtime, sessionId });
    const replay = await Effect.runPromise(
      bridge
        .subscribeRuntimeEvents({
          capabilities: ["otel"],
          replay: true,
          sessionId,
        })
        .pipe(Stream.runCollect),
    );

    expect(replay.map((event) => (event._tag === "OtelSpan" ? event.name : event._tag))).toEqual([
      "RuntimeReplayState",
      "two",
      "three",
    ]);
  });

  it("preserves public correlation type inference", () => {
    const correlation = makeOtelCorrelation({
      runtime: makeDevtoolsRuntime({ enabled: true }),
    });

    expectTypeOf(correlation).toExtend<OtelCorrelation>();
    expectTypeOf(correlation.runtime).toExtend<DevtoolsRuntimeService>();
  });
});

function otelSpan(name: string, traceId: string, spanId: string) {
  return {
    name,
    spanId,
    traceId,
  };
}

function spanNameOf(event: RuntimeEventEnvelope) {
  if (event._tag !== "OtelSpan") {
    throw new Error(`Expected OtelSpan, received ${event._tag}`);
  }

  return event.name;
}
