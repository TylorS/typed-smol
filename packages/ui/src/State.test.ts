import { assert, describe, it } from "vitest";
import { Effect, Layer } from "effect";
import { RefSubject } from "@typed/fx";
import * as State from "./State.js";

describe("typed/ui/State", () => {
  it("uses RefSubject directly for state updates and event-time reads", () =>
    Effect.gen(function* () {
      const state = yield* RefSubject.make({ open: false });

      assert.deepStrictEqual(yield* state, { open: false });

      yield* RefSubject.update(state, (current) => ({ ...current, open: true }));

      assert.deepStrictEqual(yield* state, { open: true });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports focused computed selector reads through RefSubject.map", () =>
    Effect.gen(function* () {
      const state = yield* RefSubject.make({ open: false, label: "Menu" });
      const open = RefSubject.map(state, (current) => current.open);

      assert.strictEqual(yield* open, false);

      yield* RefSubject.update(state, (current) => ({ ...current, open: true }));

      assert.strictEqual(yield* open, true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("supports provider lookup for the same RefSubject", () =>
    Effect.gen(function* () {
      const tag = State.tag<{ readonly open: boolean }>("TestDisclosureState");
      const state = yield* RefSubject.make({ open: false });
      const found = yield* Effect.provide(tag, Layer.succeed(tag, state));

      assert.strictEqual(found, state);
    }).pipe(Effect.scoped, Effect.runPromise));
});
