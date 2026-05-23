import { assert, describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Select from "./Select.js";

describe("typed/ui/Select", () => {
  it("renders native popover trigger/content and option state", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const triggerRoot = window.document.createElement("div");
      const contentRoot = window.document.createElement("div");
      window.document.body.append(triggerRoot, contentRoot);
      const state = yield* Select.makeState<string>({
        id: "status-select",
        value: "draft",
        activeId: "draft",
        open: false,
      });

      const [trigger] = yield* render(
        Select.Trigger({ state, content: "Draft" }),
        triggerRoot,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const [content] = yield* render(
        Select.Content({
          state,
          label: "Status",
          content: html`${Select.Option({
            state,
            id: "draft",
            value: "draft",
            content: "Draft",
          })}
          ${Select.Option({
            state,
            id: "published",
            value: "published",
            disabled: true,
            content: "Published",
          })}`,
        }),
        contentRoot,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(trigger instanceof window.HTMLButtonElement);
      assert(content instanceof window.HTMLElement);
      expect(trigger.getAttribute("popovertarget")).toBe("status-select");
      expect(trigger.getAttribute("popovertargetaction")).toBe("toggle");
      expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(trigger.getAttribute("data-open")).toBe("false");
      expect(content.id).toBe("status-select");
      expect(content.getAttribute("popover")).toBe("auto");
      expect(content.getAttribute("role")).toBe("listbox");
      expect(content.getAttribute("aria-label")).toBe("Status");
      expect(content.getAttribute("data-open")).toBe("false");

      const draft = window.document.getElementById("draft");
      const published = window.document.getElementById("published");
      expect(draft?.getAttribute("role")).toBe("option");
      expect(draft?.getAttribute("aria-selected")).toBe("true");
      expect(draft?.getAttribute("data-selected")).toBe("true");
      expect(draft?.getAttribute("data-active")).toBe("true");
      expect(published?.getAttribute("aria-disabled")).toBe("true");
      expect(published?.getAttribute("data-disabled")).toBe("true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("selects enabled options and closes the popup", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Select.makeState<string>({
        id: "status-select",
        value: "draft",
        activeId: "draft",
        open: true,
      });

      yield* render(
        Select.Option({ state, id: "published", value: "published", content: "Published" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const option = window.document.getElementById("published");
      assert(option instanceof window.HTMLElement);
      option.click();
      yield* Effect.sleep(10);

      expect(yield* state).toMatchObject({
        activeId: "published",
        open: false,
        value: "published",
      });
      expect(option.getAttribute("aria-selected")).toBe("true");
      expect(option.getAttribute("data-selected")).toBe("true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("hydrates Fx-backed option id and value before selecting", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Select.makeState<string>({
        id: "status-select",
        value: "draft",
        activeId: "draft",
        open: true,
      });

      yield* render(
        Select.Option({
          state,
          id: Fx.succeed("published"),
          value: Fx.succeed("published"),
          content: "Published",
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      const option = window.document.getElementById("published");
      assert(option instanceof window.HTMLElement);
      option.click();
      yield* Effect.sleep(10);

      expect(yield* state).toMatchObject({
        activeId: "published",
        open: false,
        value: "published",
      });
      expect(option.getAttribute("data-selected")).toBe("true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("mirrors native toggle events into open state", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Select.makeState<string>({ id: "status-select", value: "draft" });
      const [content] = yield* render(
        Select.Content({ state, content: "Options" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(content instanceof window.HTMLElement);
      content.dispatchEvent(toggleEvent(window, "open"));
      yield* Effect.sleep(10);
      expect((yield* state).open).toBe(true);
      expect(content.getAttribute("data-open")).toBe("true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves active option through enabled DOM-ordered options without changing value", () =>
    Effect.gen(function* () {
      const window = new Window() as unknown as globalThis.Window & typeof globalThis;
      const first = window.document.createElement("div");
      const disabled = window.document.createElement("div");
      const last = window.document.createElement("div");
      window.document.body.append(first, disabled, last);
      const state = yield* Select.makeState<string>({
        id: "status-select",
        value: "first",
        activeId: "first",
      });

      yield* Select.move(
        state,
        [
          { id: "last", value: "last", element: last },
          { id: "disabled", value: "disabled", element: disabled, disabled: true },
          { id: "first", value: "first", element: first },
        ],
        "next",
      );
      expect(yield* state).toMatchObject({ activeId: "last", value: "first" });
    }).pipe(Effect.scoped, Effect.runPromise));

  it("moves active option from content keyboard events", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Select.makeState<string>({
        id: "status-select",
        value: "draft",
        activeId: "draft",
      });
      yield* render(
        Select.Content({
          state,
          items: [
            { id: "draft", value: "draft" },
            { id: "published", value: "published" },
          ],
          content: "Options",
        }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      window.document
        .querySelector("[role=listbox]")
        ?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
      yield* Effect.sleep(10);

      expect(yield* state).toMatchObject({ activeId: "published", value: "draft" });
    }).pipe(Effect.scoped, Effect.runPromise));
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}

function toggleEvent(window: globalThis.Window & typeof globalThis, newState: "open" | "closed") {
  const event = new window.Event("toggle", { bubbles: true });
  Object.defineProperty(event, "newState", { value: newState });
  return event;
}
