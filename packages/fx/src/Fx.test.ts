import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx, Sink } from "./index.js";

describe("Fx", () => {
  it("fromIterable", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]);
      expect(yield* Fx.collectAll(fx)).toEqual([1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("filter", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3, 4]);
      const filtered = Fx.filter(fx, (n) => n % 2 === 0);
      expect(yield* Fx.collectAll(filtered)).toEqual([2, 4]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("map", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]);
      const mapped = Fx.map(fx, (n) => n * 2);
      expect(yield* Fx.collectAll(mapped)).toEqual([2, 4, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("switchMap", () =>
    Effect.gen(function* () {
      const fx = Fx.fromIterable([1, 2, 3]);
      const switched = Fx.switchMap(fx, (n) => Fx.fromIterable([n, n * 2]));
      expect(yield* Fx.collectAll(switched)).toEqual([3, 6]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("mergeAll", () =>
    Effect.gen(function* () {
      const fx1 = Fx.fromIterable([1, 2]);
      const fx2 = Fx.fromIterable([3, 4]);
      const merged = Fx.mergeAll(fx1, fx2);
      const result = yield* Fx.collectAll(merged);
      expect(result).toEqual([1, 2, 3, 4]);
    }).pipe(Effect.scoped, Effect.runPromise));

  describe("Service", () => {
    it("should allow defining an Fx as a Service", () =>
      Effect.gen(function* () {
        class MyFx extends Fx.Service<MyFx, number>()("MyFx") {}

        const layer = MyFx.make(Fx.succeed(42));

        const result = yield* Fx.collectAll(MyFx).pipe(Effect.provide(layer));
        expect(result).toEqual([42]);
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});

describe("Sink", () => {
  describe("Service", () => {
    it("should allow defining a Sink as a Service", () =>
      Effect.gen(function* () {
        class MySink extends Sink.Service<MySink, number>()("MySink") {}

        let value = 0;
        const layer = MySink.make(
          Effect.failCause,
          (n) => Effect.sync(() => (value += n)),
        );

        yield* MySink.onSuccess(1).pipe(Effect.provide(layer));
        expect(value).toEqual(1);

        yield* MySink.onSuccess(2).pipe(Effect.provide(layer));
        expect(value).toEqual(3);
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
