import { assert, describe, it } from "vitest";
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Popover from "./Popover.js";

describe("typed/ui/Popover", () => {
  it("renders native popover content and trigger relationship", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const triggerRoot = window.document.createElement("div");
      const contentRoot = window.document.createElement("div");
      window.document.body.append(triggerRoot, contentRoot);
      const state = yield* Popover.makeState({
        id: "menu-popover",
        open: false,
        mode: "auto",
      });
      const [trigger] = yield* render(
        Popover.Trigger({ state, content: "Open" }),
        triggerRoot,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const [content] = yield* render(
        Popover.Content({ state, content: "Menu" }),
        contentRoot,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(trigger instanceof window.HTMLButtonElement);
      assert(content instanceof window.HTMLElement);
      assert.strictEqual(trigger.getAttribute("popovertarget"), "menu-popover");
      assert.strictEqual(trigger.getAttribute("popovertargetaction"), "toggle");
      assert.strictEqual(trigger.dataset.open, "false");
      assert.strictEqual(content.getAttribute("popover"), "auto");
      assert.strictEqual(content.id, "menu-popover");
      assert.strictEqual(content.dataset.open, "false");
      assert.strictEqual(content.dataset.mode, "auto");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("mirrors native toggle events into RefSubject state", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Popover.makeState({
        id: "menu-popover",
        open: false,
        mode: "auto",
      });
      const [content] = yield* render(
        Popover.Content({ state, content: "Menu" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(content instanceof window.HTMLElement);
      content.dispatchEvent(toggleEvent(window, "open"));
      yield* Effect.sleep(10);
      assert.deepStrictEqual(yield* state, {
        id: "menu-popover",
        open: true,
        mode: "auto",
      });
      assert.strictEqual(content.dataset.open, "true");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("commands the registered native popover when state changes", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const calls: Array<"show" | "hide"> = [];
      const state = yield* Popover.makeState({
        id: "menu-popover",
        open: false,
        mode: "auto",
      });
      const [content] = yield* render(
        Popover.Content({ state, content: "Menu" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      Object.assign(content, {
        showPopover: () => calls.push("show"),
        hidePopover: () => calls.push("hide"),
      });

      yield* Popover.setOpen(state, true);
      yield* Popover.setOpen(state, false);

      assert.deepStrictEqual(calls, ["show", "hide"]);
      assert.strictEqual((yield* state).open, false);
    }).pipe(Effect.scoped, Effect.runPromise));

  it("dismisses the native popover as well as the backing state", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      let hideCount = 0;
      const state = yield* Popover.makeState({
        id: "menu-popover",
        open: true,
        mode: "auto",
      });
      const [content] = yield* render(
        Popover.Content({ state, content: "Menu" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      const [dismiss] = yield* render(
        Popover.Dismiss({ state, content: "Dismiss" }),
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);
      Object.assign(content, {
        hidePopover: () => {
          hideCount += 1;
        },
      });

      assert(dismiss instanceof window.HTMLButtonElement);
      dismiss.click();
      yield* Effect.sleep(10);

      assert.strictEqual(hideCount, 1);
      assert.strictEqual((yield* state).open, false);
      assert.strictEqual(dismiss.getAttribute("popovertarget"), "menu-popover");
      assert.strictEqual(dismiss.getAttribute("popovertargetaction"), "hide");
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not render custom overlay or focus-trap elements", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const state = yield* Popover.makeState({
        id: "menu-popover",
        open: false,
        mode: "auto",
      });
      yield* render(Popover.Content({ state, content: "Menu" }), window.document.body).pipe(
        Fx.provide(layer),
        Fx.take(1),
        Fx.collectAll,
      );

      assert.strictEqual(window.document.querySelector("[data-overlay]"), null);
      assert.strictEqual(window.document.querySelector("[data-focus-trap]"), null);
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
