import { assert, describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Combobox from "./Combobox.js";

describe("typed/ui/Combobox", () => {
  it("links the input to a native popover listbox", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Combobox.makeState<string>({ id: "fruit-popup", value: "Apple", open: true });

      const [input] = yield* render(
        Combobox.Input({ state, id: "fruit", placeholder: "Fruit" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const [popover] = yield* render(
        Combobox.Popover({ state, content: "Options" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(input instanceof window.HTMLInputElement);
      assert(popover instanceof window.HTMLElement);
      expect(input.getAttribute("role")).toBe("combobox");
      expect(input.getAttribute("aria-controls")).toBe("fruit-popup");
      expect(input.getAttribute("aria-expanded")).toBe("true");
      expect(popover.id).toBe("fruit-popup");
      expect(popover.getAttribute("popover")).toBe("auto");
      expect(popover.getAttribute("data-open")).toBe("true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves active item and selects it from input keyboard events", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Combobox.makeState<string>({ id: "fruit-popup", value: "", open: true });
      const [input] = yield* render(
        Combobox.Input({
          state,
          items: [
            { id: "apple", value: "Apple" },
            { id: "banana", value: "Banana" },
          ],
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(input instanceof window.HTMLInputElement, "Input should be an input element");

      input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(10);
      expect(yield* state).toMatchObject({ activeId: "apple", value: "", open: true });

      input.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      yield* Effect.sleep(10);
      expect(yield* state).toMatchObject({ activeId: "apple", value: "Apple", open: false });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("filters async item sources, autocompletes, and auto-selects the first match", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const items = yield* RefSubject.make([
        { id: "apple", value: "Apple", textValue: "Apple" },
        { id: "banana", value: "Banana", textValue: "Banana" },
      ]);
      const state = yield* Combobox.makeState<string>({ id: "fruit-popup", value: "" });
      const [input] = yield* render(
        Combobox.Input({
          state,
          items,
          autocomplete: "both",
          autoSelect: true,
          filter: (item, query) => item.textValue?.toLowerCase().startsWith(query.toLowerCase()) === true,
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(input instanceof window.HTMLInputElement);
      input.value = "Ba";
      input.dispatchEvent(new window.InputEvent("input", { bubbles: true }));
      yield* Effect.sleep(10);

      expect(yield* state).toMatchObject({
        activeId: "banana",
        filteredItems: [{ id: "banana", value: "Banana", textValue: "Banana" }],
        value: "Banana",
        open: true,
      });
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}
