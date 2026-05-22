import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Checkbox from "./Checkbox.js";

describe("typed/ui/Checkbox", () => {
  it("renders native checkbox state and data attrs", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Checkbox.makeState({ checked: "mixed" });

      const [root] = yield* render(
        Checkbox.Input({
          state,
          id: "terms",
          name: "terms",
          value: "yes",
          required: true,
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLInputElement);
      assert.strictEqual(root.type, "checkbox");
      assert.strictEqual(root.id, "terms");
      assert.strictEqual(root.name, "terms");
      assert.strictEqual(root.value, "yes");
      assert.strictEqual(root.checked, false);
      assert.strictEqual(root.indeterminate, true);
      assert.strictEqual(root.required, true);
      assert.strictEqual(root.getAttribute("aria-checked"), "mixed");
      assert.strictEqual(root.dataset.checked, "mixed");

      yield* Checkbox.setChecked(state, true);
      yield* Effect.sleep(10);

      assert.strictEqual(root.checked, true);
      assert.strictEqual(root.indeterminate, false);
      assert.strictEqual(root.getAttribute("aria-checked"), "true");
      assert.strictEqual(root.dataset.checked, "true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("updates the backing RefSubject from native changes", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Checkbox.makeState({ checked: false });

      const [root] = yield* render(Checkbox.Input({ state }), window.document.body).pipe(
        Fx.provide(layer),
        Fx.take(1),
        Fx.collectAll,
      );

      assert(root instanceof window.HTMLInputElement);
      root.checked = true;
      root.dispatchEvent(new window.Event("change", { bubbles: true }));
      yield* Effect.sleep(10);

      assert.deepStrictEqual(yield* state, { checked: true });
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}
