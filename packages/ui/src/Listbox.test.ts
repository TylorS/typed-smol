import { assert, describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Listbox from "./Listbox.js";

describe("typed/ui/Listbox", () => {
  it("renders listbox and option semantics with selected, active, and disabled data attrs", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Listbox.makeState({
        value: "draft",
        activeId: "draft",
        virtualFocus: true,
      });

      yield* render(
        Listbox.Root({
          state,
          id: "status-listbox",
          label: "Status",
          content: html`${Listbox.Option({
            state,
            id: "draft",
            value: "draft",
            content: "Draft",
          })}
          ${Listbox.Option({
            state,
            id: "published",
            value: "published",
            disabled: true,
            content: "Published",
          })}`,
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const root = window.document.getElementById("status-listbox");
      const draft = window.document.getElementById("draft");
      const published = window.document.getElementById("published");

      expect(root?.getAttribute("role")).toBe("listbox");
      expect(root?.getAttribute("aria-label")).toBe("Status");
      expect(root?.getAttribute("aria-orientation")).toBe("vertical");
      expect(root?.getAttribute("aria-activedescendant")).toBe("draft");
      expect(draft?.getAttribute("role")).toBe("option");
      expect(draft?.getAttribute("aria-selected")).toBe("true");
      expect(draft?.getAttribute("data-selected")).toBe("true");
      expect(draft?.getAttribute("data-active")).toBe("true");
      expect(draft?.getAttribute("tabindex")).toBe("-1");
      expect(published?.getAttribute("aria-disabled")).toBe("true");
      expect(published?.getAttribute("data-disabled")).toBe("true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("selects an option through item interaction", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Listbox.makeState({ value: "draft", activeId: "draft" });

      yield* render(
        Listbox.Option({ state, id: "published", value: "published", content: "Published" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const option = window.document.getElementById("published");
      assert(option instanceof window.HTMLElement);
      option.click();
      yield* Effect.sleep(10);

      expect(yield* state).toMatchObject({ activeId: "published", value: "published" });
      expect(option.getAttribute("aria-selected")).toBe("true");
      expect(option.getAttribute("data-selected")).toBe("true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves active item through enabled DOM-ordered options without changing value", () =>
    Effect.gen(function* () {
      const window = new Window();
      const first = window.document.createElement("div");
      const disabled = window.document.createElement("div");
      const last = window.document.createElement("div");
      window.document.body.append(first, disabled, last);
      const state = yield* Listbox.makeState({ value: "first", activeId: "first" });

      yield* Listbox.move(
        state,
        [
          { id: "last", value: "last", element: last },
          { id: "disabled", value: "disabled", element: disabled, disabled: true },
          { id: "first", value: "first", element: first },
        ],
        "next",
      );
      expect(yield* state).toMatchObject({ activeId: "last", value: "first" });

      yield* Listbox.move(
        state,
        [
          { id: "first", value: "first", element: first },
          { id: "last", value: "last", element: last },
        ],
        "next",
      );
      expect(yield* state).toMatchObject({ activeId: "first", value: "first" });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves active option from root keyboard events", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Listbox.makeState({ value: "first", activeId: "first" });
      yield* render(
        Listbox.Root({
          state,
          items: [
            { id: "first", value: "first" },
            { id: "second", value: "second" },
          ],
          content: "Options",
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      window.document
        .querySelector("[role=listbox]")
        ?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(10);

      expect(yield* state).toMatchObject({ activeId: "second", value: "first" });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves active option with typeahead text", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Listbox.makeState({ value: "first", activeId: "first" });
      yield* render(
        Listbox.Root({
          state,
          items: [
            { id: "first", value: "first", textValue: "First" },
            { id: "second", value: "second", textValue: "Second" },
          ],
          content: "Options",
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      window.document
        .querySelector("[role=listbox]")
        ?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "s", bubbles: true }));
      yield* Effect.sleep(10);

      expect(yield* state).toMatchObject({ activeId: "second", value: "first" });
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}
