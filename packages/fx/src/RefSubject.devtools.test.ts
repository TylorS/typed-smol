import { describe, expect, expectTypeOf, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { Fx, RefSubject } from "./index.js";
import type { RefSubjectDevtoolsEvent, RefSubjectDevtoolsObserver } from "./RefSubject/devtools.js";

describe("RefSubject DevTools hooks", () => {
  it("captures snapshots and updates with version, subscriber count, and ids", () =>
    Effect.gen(function* () {
      const events: Array<RefSubjectDevtoolsEvent<number>> = [];
      const ref = yield* RefSubject.make(0, {
        devtools: {
          id: "counter",
          observer: collectRefSubjectEvents(events),
          serviceId: "CounterState",
        },
      });

      expect(events).toEqual([]);

      expect(yield* ref).toBe(0);
      yield* RefSubject.set(ref, 1);

      expect(events).toEqual([
        {
          _tag: "Snapshot",
          id: "counter",
          serviceId: "CounterState",
          subscriberCount: 0,
          value: 0,
          version: 0,
        },
        {
          _tag: "Updated",
          id: "counter",
          serviceId: "CounterState",
          subscriberCount: 0,
          value: 1,
          version: 1,
        },
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not add user-visible emissions or report equality-skipped writes", () =>
    Effect.gen(function* () {
      const events: Array<RefSubjectDevtoolsEvent<number>> = [];
      const ref = yield* RefSubject.make(0, {
        devtools: {
          id: "counter",
          observer: collectRefSubjectEvents(events),
        },
      });
      const fiber = yield* Fx.collectUpToFork(ref, 2);

      yield* Effect.yieldNow;
      yield* RefSubject.set(ref, 0);
      yield* RefSubject.set(ref, 1);

      expect(yield* Fiber.join(fiber)).toEqual([0, 1]);
      expect(events).toEqual([
        {
          _tag: "Snapshot",
          id: "counter",
          subscriberCount: 0,
          value: 0,
          version: 0,
        },
        {
          _tag: "Updated",
          id: "counter",
          subscriberCount: 1,
          value: 1,
          version: 1,
        },
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("swallows observer failures without changing RefSubject semantics", () =>
    Effect.gen(function* () {
      const ref = yield* RefSubject.make(0, {
        devtools: {
          observer: {
            onSnapshot() {
              throw new Error("snapshot observer failed");
            },
            onUpdate() {
              throw new Error("update observer failed");
            },
          },
        },
      });

      expect(yield* ref).toBe(0);
      yield* RefSubject.set(ref, 1);
      expect(yield* ref).toBe(1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("propagates RefSubject service ids into DevTools metadata", () =>
    Effect.gen(function* () {
      class Counter extends RefSubject.Service<Counter, number>()("Counter") {}

      const events: Array<RefSubjectDevtoolsEvent<number>> = [];
      const layer = Counter.make(0, {
        devtools: {
          id: "counter-service",
          observer: collectRefSubjectEvents(events),
        },
      });

      yield* Effect.gen(function* () {
        expect(yield* Counter).toBe(0);
        yield* Counter.updates((ref) => ref.set(1));
      }).pipe(Effect.provide(layer));

      expect(events).toMatchObject([
        { _tag: "Snapshot", id: "counter-service", serviceId: "Counter" },
        { _tag: "Updated", id: "counter-service", serviceId: "Counter" },
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("preserves public observer type inference", () => {
    expectTypeOf(collectRefSubjectEvents<number>([])).toExtend<
      RefSubjectDevtoolsObserver<number>
    >();
  });
});

function collectRefSubjectEvents<A>(
  events: Array<RefSubjectDevtoolsEvent<A>>,
): RefSubjectDevtoolsObserver<A> {
  return {
    onSnapshot: (event) => events.push(event),
    onUpdate: (event) => events.push(event),
  };
}
