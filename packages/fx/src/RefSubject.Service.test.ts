import { describe, expect, expectTypeOf, it } from "vitest";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Scope from "effect/Scope";
import * as RefSubject from "./RefSubject/RefSubject.js";

describe("RefSubject.Service", () => {
  it("creates a service with a stable id", () => {
    const Count = RefSubject.Service<number>()("@app/routes/counter/Count");

    expect(Count.id).toBe("@app/routes/counter/Count");
    expect(Count.service).toBeDefined();
  });

  it("builds a layer that yields a RefSubject", async () => {
    const Count = RefSubject.Service<number>()("@app/routes/counter/Count");

    const value = await Effect.runPromise(
      Effect.gen(function* () {
        const count = yield* Count.service;
        yield* RefSubject.set(count, 3);
        return yield* Count;
      }).pipe(Effect.provide(Count.make(0)), Effect.scoped),
    );

    expect(value).toBe(3);
  });

  it("supports effectful initializers", async () => {
    const Count = RefSubject.Service<number>()("@app/routes/counter/EffectCount");

    const value = await Effect.runPromise(
      Effect.gen(function* () {
        return yield* Count;
      }).pipe(Effect.provide(Count.make(Effect.succeed(7))), Effect.scoped),
    );

    expect(value).toBe(7);
  });

  it("preserves RefSubject value, error, and service types", () => {
    class CounterEnv extends Context.Service<CounterEnv>()("CounterEnv", {
      sync: () => ({ seed: 1 }),
    }) {}

    const Count = RefSubject.Service<number, "bad">()("@app/routes/counter/TypedCount");
    const initializer = Effect.map(CounterEnv, ({ seed }) => seed);
    const layer = Count.make(initializer);

    expectTypeOf(Count).toExtend<RefSubject.RefSubject<number, "bad", typeof Count>>();
    expectTypeOf(layer).toExtend<Layer.Layer<typeof Count, never, CounterEnv>>();
    expectTypeOf(Count.make(0)).toExtend<Layer.Layer<typeof Count>>();
    expectTypeOf(Count.layer(RefSubject.make(1))).toExtend<
      Layer.Layer<typeof Count, never, Scope.Scope>
    >();
  });
});
