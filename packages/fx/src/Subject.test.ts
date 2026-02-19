import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import * as Fx from "./Fx/index.js";
import * as Subject from "./Subject.js";

describe("Subject", () => {
  it("allows multicasting values", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number>();
      const fiber = yield* Fx.collectAllFork(subject);
      yield* Effect.yieldNow;

      yield* subject.onSuccess(1);
      yield* subject.onSuccess(2);
      yield* subject.onSuccess(3);
      yield* subject.interrupt;

      expect(yield* Fiber.join(fiber)).toEqual([1, 2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("allows replay of values", () =>
    Effect.gen(function* () {
      const subject = Subject.unsafeMake<number>(2);

      yield* subject.onSuccess(1);
      yield* subject.onSuccess(2);
      yield* subject.onSuccess(3);

      expect(yield* Fx.collectAll(Fx.take(subject, 2))).toEqual([2, 3]);
    }).pipe(Effect.scoped, Effect.runPromise));

  describe("Service", () => {
    it("should allow defining a Subject as a Service", () =>
      Effect.gen(function* () {
        class MySubject extends Subject.Service<MySubject, number>()("MySubject") {}

        const layer = MySubject.make(1);

        yield* Effect.gen(function* () {
          yield* MySubject.onSuccess(1);
          const result = yield* Fx.collectAll(Fx.take(MySubject, 1));
          expect(result).toEqual([1]);
        }).pipe(Effect.provide(layer));
      }).pipe(Effect.scoped, Effect.runPromise));
  });
});
