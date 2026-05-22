import { assert, describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Menu from "./Menu.js";

describe("typed/ui/Menu", () => {
  it("renders native popover trigger/content and menu item data attrs", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const triggerRoot = window.document.createElement("div");
      const contentRoot = window.document.createElement("div");
      window.document.body.append(triggerRoot, contentRoot);
      const state = yield* Menu.makeState({
        id: "actions-menu",
        activeId: "rename",
        open: false,
      });

      const [trigger] = yield* render(
        Menu.Trigger({ state, content: "Actions" }),
        triggerRoot,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const [content] = yield* render(
        Menu.Content({
          state,
          label: "Actions",
          content: html`${Menu.Item({ state, id: "rename", content: "Rename" })}
            ${Menu.Item({ state, id: "archive", disabled: true, content: "Archive" })}`,
        }),
        contentRoot,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(trigger instanceof window.HTMLButtonElement);
      assert(content instanceof window.HTMLElement);
      expect(trigger.getAttribute("popovertarget")).toBe("actions-menu");
      expect(trigger.getAttribute("popovertargetaction")).toBe("toggle");
      expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(trigger.getAttribute("data-open")).toBe("false");
      expect(content.id).toBe("actions-menu");
      expect(content.getAttribute("popover")).toBe("auto");
      expect(content.getAttribute("role")).toBe("menu");
      expect(content.getAttribute("aria-label")).toBe("Actions");
      expect(content.getAttribute("data-open")).toBe("false");

      const rename = window.document.getElementById("rename");
      const archive = window.document.getElementById("archive");
      expect(rename?.getAttribute("role")).toBe("menuitem");
      expect(rename?.getAttribute("tabindex")).toBe("0");
      expect(rename?.getAttribute("data-active")).toBe("true");
      expect(rename?.getAttribute("data-disabled")).toBe("false");
      expect(archive?.getAttribute("aria-disabled")).toBe("true");
      expect(archive?.getAttribute("data-disabled")).toBe("true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("mirrors native toggle events into the backing RefSubject", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Menu.makeState({ id: "actions-menu", open: false });
      const [content] = yield* render(
        Menu.Content({ state, content: "Actions" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(content instanceof window.HTMLElement);
      content.dispatchEvent(toggleEvent(window, "open"));
      yield* Effect.sleep(10);

      expect((yield* state).open).toBe(true);
      expect(content.getAttribute("data-open")).toBe("true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves active item through enabled DOM-ordered items", () =>
    Effect.gen(function* () {
      const window = new Window();
      const root = window.document.createElement("div");
      const first = window.document.createElement("button");
      const disabled = window.document.createElement("button");
      const last = window.document.createElement("button");
      root.append(first, disabled, last);
      const state = yield* Menu.makeState({ id: "actions-menu", activeId: "first" });

      yield* Menu.move(
        state,
        [
          { id: "last", element: last },
          { id: "disabled", element: disabled, disabled: true },
          { id: "first", element: first },
        ],
        "next",
      );
      expect((yield* state).activeId).toBe("last");

      yield* Menu.move(state, [{ id: "first", element: first }, { id: "last", element: last }], "next");
      expect((yield* state).activeId).toBe("first");
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}

function toggleEvent(window: Window, newState: "open" | "closed") {
  const event = new window.Event("toggle", { bubbles: true });
  Object.defineProperty(event, "newState", { value: newState });
  return event;
}
