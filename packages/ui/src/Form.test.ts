import { assert, describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Form from "./Form.js";

describe("typed/ui/Form", () => {
  it("validates values with a schema and exposes errors", () =>
    Effect.gen(function* () {
      const state = yield* Form.makeState({
        values: { email: "" },
        schema: Schema.Struct({ email: Schema.String.check(Schema.isMinLength(1)) }),
      });

      const exit = yield* Form.validate(state).pipe(Effect.exit);

      assert.strictEqual(exit._tag, "Failure");
      expect((yield* state).errors.email).toBeTruthy();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("pushes and removes array field values", () =>
    Effect.gen(function* () {
      const state = yield* Form.makeState({ values: { tags: ["one"] as string[] } });

      yield* Form.pushValue(state, "tags", "two");
      expect((yield* state).values.tags).toEqual(["one", "two"]);

      yield* Form.removeValue(state, "tags", 0);
      expect((yield* state).values.tags).toEqual(["two"]);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("renders Push and Remove buttons for array fields", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Form.makeState({ values: { tags: ["one"] as string[] } });
      const [push] = yield* render(
        Form.Push({ state, name: "tags", value: "two", content: "Add" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const [remove] = yield* render(
        Form.Remove({ state, name: "tags", index: 0, content: "Remove" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      push.click();
      yield* Effect.sleep(10);
      expect((yield* state).values.tags).toEqual(["one", "two"]);

      remove.click();
      yield* Effect.sleep(10);
      expect((yield* state).values.tags).toEqual(["two"]);
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}
