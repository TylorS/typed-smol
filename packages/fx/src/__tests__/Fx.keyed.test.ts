import * as Deferred from "effect/Deferred";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Scheduler from "effect/Scheduler";
import { describe, expect, it } from "vitest";
import { Fx } from "../index.js";

describe("Fx.keyed", () => {
  it("fails duplicate keys through the typed error channel before starting keyed values", () =>
    Effect.gen(function* () {
      let started = 0;
      const keyed = Fx.keyed(Fx.succeed([{ id: "duplicate" }, { id: "duplicate" }]), {
        getKey: (value) => value.id,
        onValue: (_ref, key) => {
          started += 1;
          return Fx.succeed(key);
        },
      });

      const error = yield* Effect.flip(Fx.collectAll(keyed));

      expect(Cause.isIllegalArgumentError(error)).toBe(true);
      expect(error.message).toBe('Duplicate keyed() key "duplicate"');
      expect(started).toBe(0);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("emits the parent array when items only move", () =>
    Effect.gen(function* () {
      const values = Fx.concat(
        Fx.succeed([{ id: "a" }, { id: "b" }]),
        Fx.at([{ id: "b" }, { id: "a" }], 10),
      );

      const keyed = Fx.keyed(values, {
        getKey: (value) => value.id,
        onValue: (_ref, key) => Fx.succeed(key),
      });

      expect(yield* Fx.collectAll(keyed)).toEqual([
        ["a", "b"],
        ["b", "a"],
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("emits a later removal and addition after items move", () =>
    Effect.gen(function* () {
      const values = Fx.succeed([
        { id: "a", label: "A" },
        { id: "b", label: "B" },
        { id: "c", label: "C" },
      ]).pipe(
        Fx.concat(
          Fx.at(
            [
              { id: "c", label: "C" },
              { id: "a", label: "A" },
              { id: "b", label: "B" },
            ],
            10,
          ),
        ),
        Fx.concat(
          Fx.at(
            [
              { id: "c", label: "C" },
              { id: "a", label: "A2" },
              { id: "d", label: "D" },
            ],
            10,
          ),
        ),
        Fx.concat(Fx.at([], 10)),
      );

      const keyed = Fx.keyed(values, {
        getKey: (value) => value.id,
        onValue: (ref, key) => Fx.map(ref, (value) => `${key}:${value.label}`),
      });

      expect(yield* Fx.collectAll(keyed)).toEqual([
        ["a:A", "b:B", "c:C"],
        ["c:C", "a:A", "b:B"],
        ["c:C", "a:A2", "d:D"],
        [],
      ]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("lets an already-runnable fiber run before completing a large reconciliation", () =>
    Effect.gen(function* () {
      const itemCount = 512;
      const items = Array.from({ length: itemCount }, (_, id) => id);
      const sourceReady = yield* Deferred.make<void>();
      const observerReady = yield* Deferred.make<void>();
      const release = yield* Deferred.make<void>();
      let reconciled = 0;
      let observedReconciled = -1;

      const source = Fx.make<ReadonlyArray<number>>((sink) =>
        Deferred.succeed(sourceReady, undefined).pipe(
          Effect.andThen(Deferred.await(release)),
          Effect.andThen(sink.onSuccess(items)),
        ),
      );
      const keyed = Fx.keyed(source, {
        getKey: (value) => value,
        onValue: (_ref, key) => {
          reconciled += 1;
          return Fx.succeed(key);
        },
      });

      const keyedFiber = yield* Fx.collectAll(keyed).pipe(
        Effect.provideService(Scheduler.MaxOpsBeforeYield, 16),
        Effect.forkScoped,
      );
      yield* Deferred.await(sourceReady);

      const observerFiber = yield* Effect.gen(function* () {
        yield* Deferred.succeed(observerReady, undefined);
        yield* Deferred.await(release);
        observedReconciled = reconciled;
      }).pipe(Effect.forkScoped);
      yield* Deferred.await(observerReady);

      yield* Deferred.succeed(release, undefined);
      yield* Fiber.join(observerFiber);

      expect(observedReconciled).toBeLessThan(itemCount);

      const emissions = yield* Fiber.join(keyedFiber);
      expect(emissions.at(-1)).toEqual(items);
    }).pipe(Effect.scoped, Effect.runPromise));
});
