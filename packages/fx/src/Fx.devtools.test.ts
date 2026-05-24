import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import { describe, expect, expectTypeOf, it } from "vitest";
import { Fx } from "./index.js";
import type { Fx as FxType } from "./Fx/Fx.js";
import { withFxDevtools, type FxDevtoolsEvent, type FxDevtoolsObserver } from "./Fx/devtools.js";

describe("Fx DevTools hooks", () => {
  it("captures component-owned lifecycle events without changing emissions", () =>
    Effect.gen(function* () {
      const events: Array<FxDevtoolsEvent<number, never>> = [];
      const fx = Fx.fromIterable([1, 2]).pipe(
        withFxDevtools({
          id: "render-stream",
          observer: collectFxEvents(events),
          ownerId: "cmp:counter",
        }),
      );

      expect(yield* Fx.collectAll(fx)).toEqual([1, 2]);
      expect(events).toEqual([
        {
          _tag: "Started",
          id: "render-stream",
          ownerId: "cmp:counter",
        },
        {
          _tag: "Emitted",
          id: "render-stream",
          ownerId: "cmp:counter",
          value: 1,
        },
        {
          _tag: "Emitted",
          id: "render-stream",
          ownerId: "cmp:counter",
          value: 2,
        },
        {
          _tag: "Completed",
          id: "render-stream",
          ownerId: "cmp:counter",
        },
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("captures RefSubject-derived failure metadata without changing failure semantics", () =>
    Effect.gen(function* () {
      const events: Array<FxDevtoolsEvent<never, string>> = [];
      const fx = Fx.fail("boom").pipe(
        withFxDevtools({
          id: "updates",
          observer: collectFxEvents(events),
          refSubjectId: "ref:counter",
        }),
      );

      const exit = yield* Effect.exit(Fx.collectAll(fx));

      expect(Exit.isFailure(exit)).toBe(true);
      expect(events.map((event) => event._tag)).toEqual(["Started", "Failed"]);
      expect(events[0]).toMatchObject({
        _tag: "Started",
        id: "updates",
        refSubjectId: "ref:counter",
      });
      expect(events[1]).toMatchObject({
        _tag: "Failed",
        id: "updates",
        refSubjectId: "ref:counter",
      });
      if (events[1]?._tag !== "Failed") throw new Error("Expected failed event");
      expect(Cause.isCause(events[1].cause)).toBe(true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("captures arbitrary unowned Fx interruption without completing the stream", () =>
    Effect.gen(function* () {
      const events: Array<FxDevtoolsEvent<never, never>> = [];
      const fiber = yield* Fx.never.pipe(
        withFxDevtools({
          id: "poller",
          observer: collectFxEvents(events),
        }),
        Fx.collectAllFork,
      );

      yield* Effect.yieldNow;
      yield* Fiber.interrupt(fiber);

      expect(events.map((event) => event._tag)).toEqual(["Started", "Interrupted"]);
      expect(events[1]).toMatchObject({
        _tag: "Interrupted",
        id: "poller",
      });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("swallows observer failures without changing stream semantics", () =>
    Effect.gen(function* () {
      const fx = Fx.succeed(1).pipe(
        withFxDevtools({
          observer: {
            onComplete() {
              throw new Error("complete observer failed");
            },
            onEmit() {
              throw new Error("emit observer failed");
            },
            onStart() {
              throw new Error("start observer failed");
            },
          },
        }),
      );

      expect(yield* Fx.collectAll(fx)).toEqual([1]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves public type inference and namespace exports", () => {
    const events: Array<FxDevtoolsEvent<number, never>> = [];
    const wrapped = Fx.succeed(1).pipe(
      Fx.withDevtools({
        id: "typed-stream",
        observer: collectFxEvents(events),
      }),
    );

    expectTypeOf(wrapped).toExtend<FxType<number, never, never>>();
    expectTypeOf(collectFxEvents<number, string>([])).toExtend<
      FxDevtoolsObserver<number, string>
    >();
  });
});

function collectFxEvents<A, E>(events: Array<FxDevtoolsEvent<A, E>>): FxDevtoolsObserver<A, E> {
  return {
    onComplete: (event) => events.push(event),
    onEmit: (event) => events.push(event),
    onFailure: (event) => events.push(event),
    onInterrupt: (event) => events.push(event),
    onStart: (event) => events.push(event),
  };
}
