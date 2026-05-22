import { assert, describe, it } from "vitest";
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Dialog from "./Dialog.js";

describe("typed/ui/Dialog", () => {
  it("renders modal dialog semantics when open", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Dialog.makeState({ open: true });
      const [root] = yield* render(
        Dialog.Content({ state, label: "Preferences", content: "Body" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLElement);
      const dialog = root as HTMLElement;
      assert.strictEqual(dialog.getAttribute("role"), "dialog");
      assert.strictEqual(dialog.getAttribute("aria-modal"), "true");
      assert.strictEqual(dialog.getAttribute("aria-label"), "Preferences");
      assert.strictEqual(dialog.dataset.open, "true");
      assert.strictEqual(dialog.hidden, false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hides content and updates data state when closed", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Dialog.makeState({ open: true });
      const [root] = yield* render(
        Dialog.Content({ state, label: "Preferences", content: "Body" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(root instanceof window.HTMLElement);
      const dialog = root as HTMLElement;
      yield* Dialog.setOpen(state, false);
      yield* Effect.sleep(10);

      assert.strictEqual(dialog.dataset.open, "false");
      assert.strictEqual(dialog.hidden, true);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("opens and closes through trigger controls", () => {
    const [window, layer] = createHappyDomLayer();

    return Effect.gen(function* () {
      const state = yield* Dialog.makeState({ open: false });
      const triggerRoot = window.document.createElement("div");
      const closeRoot = window.document.createElement("div");
      window.document.body.append(triggerRoot, closeRoot);
      const [trigger] = yield* render(
        Dialog.Trigger({ state, controls: "dialog", content: "Open" }),
        triggerRoot,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const [close] = yield* render(
        Dialog.Close({ state, content: "Close" }),
        closeRoot,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(trigger instanceof window.HTMLButtonElement);
      assert(close instanceof window.HTMLButtonElement);
      trigger.focus();
      trigger.click();
      yield* Effect.sleep(10);
      assert.deepStrictEqual(yield* state, { open: true });

      close.focus();
      close.click();
      yield* Effect.sleep(10);
      assert.deepStrictEqual(yield* state, { open: false });
      assert.strictEqual(window.document.activeElement, trigger);
    }).pipe(Effect.scoped, Effect.runPromise);
  });
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}
