import { assert, describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, isElement, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Toolbar from "./Toolbar.js";

describe("typed/ui/Toolbar", () => {
  it("renders toolbar role, label, orientation, and content", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const layer = DomRenderTemplate.using(window.document);
      const state = yield* Toolbar.makeState({ activeId: "bold", orientation: "horizontal" });

      yield* render(
        Toolbar.Root({
          state,
          label: "Editor",
          content: html`<button id="bold">B</button><button id="italic">I</button>`,
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const root = window.document.querySelector("[role=toolbar]");
      expect(root?.getAttribute("aria-label")).toBe("Editor");
      expect(root?.getAttribute("aria-orientation")).toBe("horizontal");
      expect(window.document.getElementById("bold")?.textContent).toBe("B");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves focus state through toolbar controls as one composite stop", () =>
    Effect.gen(function* () {
      const state = yield* Toolbar.makeState({ activeId: "bold" });
      yield* Toolbar.move(state, [{ id: "bold" }, { id: "italic" }], "next");
      expect((yield* state).activeId).toBe("italic");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves active toolbar item from root keyboard events", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const layer = DomRenderTemplate.using(window.document);
      const state = yield* Toolbar.makeState({ activeId: "bold" });

      yield* render(
        Toolbar.Root({
          state,
          items: [{ id: "bold" }, { id: "italic" }],
          content: html`${Toolbar.Item({ state, id: "bold", content: "B" })}
          ${Toolbar.Item({ state, id: "italic", content: "I" })}`,
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      window.document
        .querySelector("[role=toolbar]")
        ?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
      yield* Effect.sleep(10);

      expect((yield* state).activeId).toBe("italic");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("uses resolved reactive item ids for roving tabindex", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const layer = DomRenderTemplate.using(window.document);
      const id = yield* RefSubject.make("bold");
      const state = yield* Toolbar.makeState({ activeId: "bold" });
      const [item] = yield* render(
        Toolbar.Item({ state, id, content: "B" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(isElement(item), "Item should be an element");

      expect(item.getAttribute("id")).toBe("bold");
      expect(item.getAttribute("tabindex")).toBe("0");

      yield* RefSubject.set(id, "italic");
      yield* Effect.sleep(10);

      expect(item.getAttribute("id")).toBe("italic");
      expect(item.getAttribute("tabindex")).toBe("-1");
    }).pipe(Effect.scoped, Effect.runPromise));
});
