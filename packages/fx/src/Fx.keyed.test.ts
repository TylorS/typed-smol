import * as Effect from "effect/Effect";
import { describe, expect, it } from "vitest";
import { Fx } from "./index.js";

describe("Fx.keyed", () => {
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
});
