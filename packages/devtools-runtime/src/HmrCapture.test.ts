import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";
import {
  makeDevtoolsSessionId,
  makeHmrBoundaryId,
  makeTemplateHash,
  type HmrStatusFact,
  type RuntimeEventStreamItem,
} from "@typed/devtools-protocol";
import { describe, expect, expectTypeOf, it } from "vitest";
import { makeDevtoolsBridge } from "./Bridge.js";
import { makeHmrCapture, type HmrCapture } from "./HmrCapture.js";
import { makeDevtoolsRuntime, type DevtoolsRuntimeService } from "./Layer.js";

const sessionId = makeDevtoolsSessionId("runtime-session");

describe("HmrCapture", () => {
  it("replays compiler HMR facts through the runtime bridge without changing status meaning", async () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, sessionId });
    const capture = makeHmrCapture({ runtime });
    const optimizedButStateRejected = hmrStatus({
      boundary: "src/components/Button.ts#template#button",
      moduleId: "src/components/Button.ts",
      stateful: { _tag: "Rejected", reasons: ["incompatible-boundary"] },
      template: { optimized: true, templateHash: makeTemplateHash("button") },
      timestamp: 10,
    });
    const statefulButTemplatePlain = hmrStatus({
      boundary: "src/routes/counter.ts#route-component",
      moduleId: "src/routes/counter.ts",
      stateful: { _tag: "Eligible", serviceIds: ["@app/Count"] },
      template: { optimized: false },
      timestamp: 11,
    });

    capture.emitAll([optimizedButStateRejected, statefulButTemplatePlain]);
    const bridge = makeDevtoolsBridge({ capabilities: ["hmr"], runtime, sessionId });
    const streamItems = await Effect.runPromise(
      bridge
        .subscribeRuntimeEvents({
          capabilities: ["hmr"],
          replay: true,
          sessionId,
          sinceSequence: 0,
        })
        .pipe(Stream.runCollect),
    );

    expect(streamItems).toEqual([
      readyReplayState(3),
      optimizedButStateRejected,
      statefulButTemplatePlain,
    ]);
    expect(runtime.snapshot()).toEqual([optimizedButStateRejected, statefulButTemplatePlain]);
  });

  it("preserves unknown state and structured rejection reasons while reusing bounded runtime retention", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true, maxEvents: 2, sessionId });
    const capture = makeHmrCapture({ runtime });
    const eligible = hmrStatus({
      boundary: "src/routes/counter.ts#route-component",
      moduleId: "src/routes/counter.ts",
      stateful: { _tag: "Eligible", serviceIds: ["@app/Count"] },
      template: { optimized: true, templateHash: makeTemplateHash("counter") },
      timestamp: 1,
    });
    const rejected = hmrStatus({
      boundary: "src/routes/counter.ts#route-component",
      moduleId: "src/routes/counter.ts",
      stateful: { _tag: "Rejected", reasons: ["explicit-opt-out", "anonymous-refsubject"] },
      template: { optimized: true, templateHash: makeTemplateHash("counter") },
      timestamp: 2,
    });
    const unknown = hmrStatus({
      boundary: "src/routes/static.ts#route-component",
      moduleId: "src/routes/static.ts",
      stateful: { _tag: "Unknown", reason: "No stateful HMR services were inferred." },
      template: { optimized: false },
      timestamp: 3,
    });

    capture.emit(eligible);
    capture.emit(rejected);
    capture.emit(unknown);

    expect(runtime.snapshot()).toEqual([rejected, unknown]);
  });

  it("preserves public capture type inference", () => {
    const capture = makeHmrCapture({
      runtime: makeDevtoolsRuntime({ enabled: true }),
    });

    expectTypeOf(capture).toExtend<HmrCapture>();
    expectTypeOf(capture.runtime).toExtend<DevtoolsRuntimeService>();
  });
});

function hmrStatus(input: {
  readonly boundary: string;
  readonly moduleId: string;
  readonly stateful: HmrStatusFact["stateful"];
  readonly template: HmrStatusFact["template"];
  readonly timestamp: number;
}): HmrStatusFact {
  return {
    _tag: "HmrStatus",
    boundaryId: makeHmrBoundaryId(input.boundary),
    moduleId: input.moduleId,
    stateful: input.stateful,
    template: input.template,
    timestamp: input.timestamp,
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
