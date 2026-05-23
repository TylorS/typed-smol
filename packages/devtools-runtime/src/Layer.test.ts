import { makeComponentId, makeDevtoolsSessionId } from "@typed/devtools-protocol";
import type { RuntimeEventEnvelope } from "@typed/devtools-protocol";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  DevtoolsRuntime,
  DevtoolsRuntimeLayer,
  disabledDevtoolsRuntime,
  makeDevtoolsRuntime,
  type DevtoolsRuntimeService,
} from "./Layer.js";

describe("DevtoolsRuntimeLayer", () => {
  it("is disabled by default and captures no runtime events", async () => {
    const event = {
      _tag: "ComponentUnmounted",
      componentId: makeComponentId("app/root"),
      timestamp: 1,
    } as const;
    const runtime = await Effect.runPromise(
      Effect.flatMap(DevtoolsRuntime, (service) =>
        Effect.sync(() => {
          service.emit(event);
          return {
            enabled: service.enabled,
            sessionId: service.sessionId,
            snapshot: service.snapshot(),
          };
        }),
      ).pipe(Effect.provide(DevtoolsRuntimeLayer())),
    );

    expect(runtime).toEqual({
      enabled: false,
      sessionId: undefined,
      snapshot: [],
    });
  });

  it("keeps enabled snapshots immutable from caller-owned objects", async () => {
    const event: RuntimeEventEnvelope & {
      component: { displayName: string };
    } = {
      _tag: "ComponentMounted",
      component: {
        componentId: makeComponentId("app/root"),
        displayName: "Root",
        fxNodeIds: [],
        refSubjectIds: [],
      },
      timestamp: 1,
    };
    const [before, after] = await Effect.runPromise(
      Effect.flatMap(DevtoolsRuntime, (service) =>
        Effect.sync(() => {
          service.emit(event);
          const beforeMutation = service.snapshot();
          event.component.displayName = "Mutated";
          return [beforeMutation, service.snapshot()] as const;
        }),
      ).pipe(Effect.provide(DevtoolsRuntimeLayer({ enabled: true }))),
    );

    expect(before).toEqual(after);
    expect(after).toEqual([
      {
        _tag: "ComponentMounted",
        component: {
          componentId: makeComponentId("app/root"),
          displayName: "Root",
          fxNodeIds: [],
          refSubjectIds: [],
        },
        timestamp: 1,
      },
    ]);
  });

  it("can be explicitly enabled through a Layer", async () => {
    const event = {
      _tag: "ComponentUnmounted",
      componentId: makeComponentId("app/root"),
      timestamp: 1,
    } as const;
    const runtime = await Effect.runPromise(
      Effect.flatMap(DevtoolsRuntime, (service) =>
        Effect.sync(() => {
          service.emit(event);
          return {
            enabled: service.enabled,
            sessionId: service.sessionId,
            snapshot: service.snapshot(),
          };
        }),
      ).pipe(
        Effect.provide(
          DevtoolsRuntimeLayer({
            enabled: true,
            sessionId: makeDevtoolsSessionId("session-1"),
          }),
        ),
      ),
    );

    expect(runtime).toEqual({
      enabled: true,
      sessionId: makeDevtoolsSessionId("session-1"),
      snapshot: [event],
    });
  });

  it("supports explicit Layer composition without instrumentation", async () => {
    const runtime = await Effect.runPromise(
      Effect.flatMap(DevtoolsRuntime, (service) => Effect.succeed(service.snapshot())).pipe(
        Effect.provide(Layer.succeed(DevtoolsRuntime, disabledDevtoolsRuntime())),
      ),
    );

    expect(runtime).toEqual([]);
  });

  it("preserves service type inference", () => {
    const runtime = makeDevtoolsRuntime({ enabled: true });

    expectTypeOf(runtime).toExtend<DevtoolsRuntimeService>();
    expectTypeOf(DevtoolsRuntimeLayer()).toExtend<Layer.Layer<DevtoolsRuntime>>();
  });
});
