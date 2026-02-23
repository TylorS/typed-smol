import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as Ref from "effect/Ref";
import { Fx } from "./index.js";

describe("Fx", () => {
  describe("lifecycle hooks", () => {
    it("onExit runs on success", () =>
      Effect.gen(function* () {
        const tag = yield* Ref.make("unset");

        const fx = Fx.fromIterable([1]).pipe(
          Fx.onExit((exit) => Ref.set(tag, Exit.isSuccess(exit) ? "success" : "failure")),
        );

        const result = yield* Fx.collectAll(fx);
        assert.deepStrictEqual(result, [1]);
        assert.strictEqual(yield* Ref.get(tag), "success");
      }).pipe(Effect.scoped, Effect.runPromise));

    it("onExit runs on failure", () =>
      Effect.gen(function* () {
        const tag = yield* Ref.make("unset");

        const fx = Fx.fail("boom").pipe(
          Fx.onExit((exit) => Ref.set(tag, Exit.isFailure(exit) ? "failure" : "success")),
        );

        const exit = yield* Effect.exit(Fx.collectAll(fx));
        assert(Exit.isFailure(exit));
        assert.strictEqual(yield* Ref.get(tag), "failure");
      }).pipe(Effect.scoped, Effect.runPromise));

    it("onInterrupt runs when interrupted", () =>
      Effect.gen(function* () {
        const interrupted = yield* Ref.make(false);

        const fiber = yield* Fx.never.pipe(
          Fx.onInterrupt(() => Ref.set(interrupted, true)),
          Fx.collectAllFork,
        );

        yield* Fiber.interrupt(fiber);
        assert.strictEqual(yield* Ref.get(interrupted), true);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("onError runs only on failure", () =>
      Effect.gen(function* () {
        const count = yield* Ref.make(0);

        yield* Fx.fromIterable([1]).pipe(
          Fx.onError(() => Ref.update(count, (n) => n + 1)),
          Fx.collectAll,
        );
        assert.strictEqual(yield* Ref.get(count), 0);

        const exit = yield* Effect.exit(
          Fx.fail("boom").pipe(
            Fx.onError(() => Ref.update(count, (n) => n + 1)),
            Fx.collectAll,
          ),
        );
        assert(Exit.isFailure(exit));
        assert.strictEqual(yield* Ref.get(count), 1);
      }).pipe(Effect.scoped, Effect.runPromise));

    it("ensuring runs when interrupted", () =>
      Effect.gen(function* () {
        const ensured = yield* Ref.make(false);

        const fiber = yield* Fx.never.pipe(Fx.ensuring(Ref.set(ensured, true)), Fx.collectAllFork);

        yield* Fiber.interrupt(fiber);
        assert.strictEqual(yield* Ref.get(ensured), true);
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
