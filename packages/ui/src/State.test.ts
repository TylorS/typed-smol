import { assert, describe, expectTypeOf, it } from "vitest";
import { Effect } from "effect";
import { RefSubject } from "@typed/fx";
import * as Reactive from "./Reactive.js";
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

  it("keeps computed refs intact when normalizing reactive values", () =>
    Effect.gen(function* () {
      const state = yield* RefSubject.make({ count: 1 });
      const count = RefSubject.map(state, (current) => current.count);
      const normalized = yield* Reactive.makeRef(count);

      assert.strictEqual(normalized, count);
      assert.strictEqual(yield* normalized, 1);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("exposes RefSubject.Service for state providers", () =>
    Effect.gen(function* () {
      const DisclosureState = State.Service<{ readonly open: boolean }>()(
        "@typed/ui/TestDisclosureState",
      );
      const found = yield* Effect.gen(function* () {
        return yield* DisclosureState;
      }).pipe(
        Effect.provide(
          DisclosureState.make({
            open: false,
          }),
        ),
      );

      expectTypeOf(DisclosureState).toExtend<
        RefSubject.RefSubject<{ readonly open: boolean }, never, typeof DisclosureState>
      >();
      assert.deepStrictEqual(found, { open: false });
    }).pipe(Effect.scoped, Effect.runPromise));
});
