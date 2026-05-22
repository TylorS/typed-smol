import { assert, describe, it } from "vitest";
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Disclosure from "./Disclosure.js";

describe("typed/ui/Disclosure", () => {
  it("renders button aria and data state", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Disclosure.makeState({ open: false });
      const [root] = yield* render(
        Disclosure.Button({ state, controls: "panel", content: "Details" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLButtonElement);
      const button = root as HTMLButtonElement;
      assert.strictEqual(button.getAttribute("type"), "button");
      assert.strictEqual(button.getAttribute("aria-expanded"), "false");
      assert.strictEqual(button.getAttribute("aria-controls"), "panel");
      assert.strictEqual(button.dataset.open, "false");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("toggles the backing RefSubject when the button is clicked", () => {
    const [window, layer] = createHappyDomLayer();

    return Effect.gen(function* () {
      const state = yield* Disclosure.makeState({ open: false });
      const [root] = yield* render(
        Disclosure.Button({ state, controls: "panel", content: "Details" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLButtonElement);
      const button = root as HTMLButtonElement;
      button.click();
      yield* Effect.sleep(10);

      assert.deepStrictEqual(yield* state, { open: true });
      assert.strictEqual(button.getAttribute("aria-expanded"), "true");
      assert.strictEqual(button.dataset.open, "true");
    }).pipe(Effect.scoped, Effect.runPromise);
  });

  it("renders content visibility and data state", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Disclosure.makeState({ open: false });
      const [root] = yield* render(
        Disclosure.Content({ state, id: "panel", content: "Panel" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLElement);
      const panel = root as HTMLElement;
      assert.strictEqual(panel.id, "panel");
      assert.strictEqual(panel.hidden, true);
      assert.strictEqual(panel.dataset.open, "false");

      yield* Disclosure.setOpen(state, true);
      yield* Effect.sleep(10);

      assert.strictEqual(panel.hidden, false);
      assert.strictEqual(panel.dataset.open, "true");
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}
