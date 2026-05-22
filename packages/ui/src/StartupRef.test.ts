import { assert, describe, it } from "vitest";
import { Effect } from "effect";
import * as Schema from "effect/Schema";
import { RefSubject } from "@typed/fx";
import { Window } from "happy-dom";
import * as DataAttr from "./DataAttr.js";
import * as StartupRef from "./StartupRef.js";

describe("typed/ui/StartupRef", () => {
  it("initializes a RefSubject from one DOM data field", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const element = window.document.createElement("button");
      element.setAttribute("data-open", "true");
      const state = yield* RefSubject.make({ id: "menu", open: false });
      const ref = StartupRef.fromData(state, DataAttr.schema({ open: Schema.Boolean }));

      const result = ref(element);
      if (Effect.isEffect(result)) yield* result;

      assert.deepStrictEqual(yield* state, { id: "menu", open: true });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("initializes a RefSubject from multiple DOM data attrs as an object", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const element = window.document.createElement("button");
      element.setAttribute("data-open", "true");
      element.setAttribute("data-placement", "bottom");
      const state = yield* RefSubject.make({
        id: "menu",
        open: false,
        placement: "top" as "top" | "bottom",
      });
      const ref = StartupRef.fromData(
        state,
        DataAttr.schema({
          open: Schema.Boolean,
          placement: Schema.Literals(["top", "bottom"]),
        }),
      );

      const result = ref(element);
      if (Effect.isEffect(result)) yield* result;

      assert.deepStrictEqual(yield* state, {
        id: "menu",
        open: true,
        placement: "bottom",
      });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("composes multiple startup refs for one template ref callback", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const element = window.document.createElement("button");
      element.setAttribute("data-open", "true");
      element.setAttribute("data-placement", "bottom");
      const state = yield* RefSubject.make({
        open: false,
        placement: "top" as "top" | "bottom",
      });
      const ref = StartupRef.compose(
        StartupRef.fromData(state, DataAttr.schema({ open: Schema.Boolean })),
        StartupRef.fromData(
          state,
          DataAttr.schema({ placement: Schema.Literals(["top", "bottom"]) }),
        ),
      );

      const result = ref(element);
      if (Effect.isEffect(result)) yield* result;

      assert.deepStrictEqual(yield* state, { open: true, placement: "bottom" });
    }).pipe(Effect.scoped, Effect.runPromise));
});
