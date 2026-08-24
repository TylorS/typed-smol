import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Ref from "effect/Ref";
import { Fx } from "../index.js";

describe("Fx.mergeOrdered", () => {
  it("emits values from earlier sources before later sources", () =>
    Effect.gen(function* () {
      const result = yield* Fx.mergeOrdered(
        Fx.fromIterable([1, 2]),
        Fx.fromIterable([3, 4]),
        Fx.fromIterable([5]),
      ).pipe(Fx.collectAll);

      assert.deepStrictEqual(result, [1, 2, 3, 4, 5]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("starts all sources concurrently", () =>
    Effect.gen(function* () {
      const started = yield* Ref.make(0);

      const neverFirst = Fx.never;
      const countedSecond = Fx.fromEffect(
        Ref.update(started, (count) => count + 1).pipe(Effect.asVoid),
      ).pipe(Fx.continueWith(() => Fx.fromIterable([1, 2, 3])));

      const fiber = yield* Fx.mergeOrdered(neverFirst, countedSecond).pipe(
        Fx.collectAll,
        Effect.forkScoped,
      );

      yield* Effect.yieldNow;
      assert.strictEqual(yield* Ref.get(started), 1);

      yield* Fiber.interrupt(fiber);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("fails when an earlier source fails", () =>
    Effect.gen(function* () {
      const exit = yield* Fx.mergeOrdered(
        Fx.fail("boom"),
        Fx.fromIterable([1, 2]),
      ).pipe(Fx.collectAll, Effect.exit);

      assert(Exit.isFailure(exit));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("returns empty for no inputs", () =>
    Effect.gen(function* () {
      const result = yield* Fx.mergeOrdered().pipe(Fx.collectAll);
      assert.deepStrictEqual(result, []);
    }).pipe(Effect.scoped, Effect.runPromise));
});
