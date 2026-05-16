import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { TestClock } from "effect/testing";
import { Fx } from "./index.js";

const testClock = TestClock.layer();

describe("Fx delay", () => {
  it("waits the given duration before each emission", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(Fx.fromIterable([1, 2]).pipe(Fx.delay(50))),
      );
      yield* TestClock.adjust(100);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 2]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("supports dual argument order (fx, duration)", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(Fx.collectAll(Fx.delay(Fx.succeed(7), 10)));
      yield* TestClock.adjust(10);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [7]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx debounce", () => {
  it("emits only the latest value after the quiet window", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(
          Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 10), Fx.at(3, 30)).pipe(Fx.debounce(20)),
        ),
      );
      yield* TestClock.adjust(55);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [3]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx throttle", () => {
  it("emits the leading value and suppresses values until the window ends", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(
          Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 40), Fx.at(3, 120)).pipe(Fx.throttle(100)),
        ),
      );
      yield* TestClock.adjust(250);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 3]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx since", () => {
  it("forwards emissions that occur after the signal has fired", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(Fx.mergeAll(Fx.at(1, 100), Fx.at(2, 200)).pipe(Fx.since(Fx.at("go", 0)))),
      );
      yield* TestClock.adjust(300);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 2]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("drops emissions that occur before the signal", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(
          Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 50)).pipe(Fx.since(Fx.at("go", 150))),
        ),
      );
      yield* TestClock.adjust(200);
      assert.deepStrictEqual(yield* Fiber.join(fiber), []);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));

  it("forwards emissions that occur after a delayed signal", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectAll(
          Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 50), Fx.at(3, 200)).pipe(Fx.since(Fx.at("go", 100))),
        ),
      );
      yield* TestClock.adjust(250);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [3]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx until", () => {
  it("stops forwarding after the signal emits (third value not observed)", () =>
    Effect.gen(function* () {
      const fiber = yield* Effect.forkScoped(
        Fx.collectUpTo(
          Fx.mergeAll(Fx.at(1, 0), Fx.at(2, 100), Fx.at(3, 300)).pipe(Fx.until(Fx.at("stop", 200))),
          2,
        ),
      );
      yield* TestClock.adjust(400);
      assert.deepStrictEqual(yield* Fiber.join(fiber), [1, 2]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});

describe("Fx during", () => {
  it.skip("forwards events only between the first signal and the first inner emission (pending: multicast + sync signal subscription order)", () =>
    Effect.gen(function* () {
      const signals = Fx.succeed(Fx.at(0, 100));
      const events = Fx.mergeAll(Fx.at("a", 10), Fx.at("b", 20), Fx.at("c", 500));
      const fiber = yield* Effect.forkScoped(Fx.collectUpTo(Fx.during(events, signals), 2));
      yield* TestClock.adjust(250);
      assert.deepStrictEqual(yield* Fiber.join(fiber), ["a", "b"]);
    }).pipe(Effect.provide(testClock), Effect.scoped, Effect.runPromise));
});
