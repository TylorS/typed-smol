import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import * as Combobox from "./Combobox.js";
import * as Dialog from "./Dialog.js";
import * as Popover from "./Popover.js";
import * as Select from "./Select.js";
import * as Tooltip from "./Tooltip.js";
import type { Component } from "./Reactive.js";

describe("typed/ui rendered native component flows", () => {
  it("syncs rendered popover toggle events into state", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const state = yield* Popover.makeState({ id: "test-popover", open: false, mode: "auto" });
      const content = yield* renderOne<HTMLElement>(
        Popover.Content({ state, content: "Menu" }),
        root,
      );

      content.showPopover();
      yield* Effect.sleep(50);
      assert.strictEqual((yield* state).open, true);

      content.hidePopover();
      yield* Effect.sleep(50);
      assert.strictEqual((yield* state).open, false);
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("returns focus to the dialog trigger after close", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const state = yield* Dialog.makeState({ open: false });
      const trigger = yield* renderOne<HTMLButtonElement>(
        Dialog.Trigger({ state, controls: "settings", content: "Open" }),
        root,
      );
      const dialog = yield* renderOne<HTMLDialogElement>(
        Dialog.Content({ state, id: "settings", label: "Settings", content: "Panel" }),
        root,
      );
      let focusCount = 0;
      const focus = trigger.focus.bind(trigger);
      trigger.focus = () => {
        focusCount += 1;
        focus();
      };

      trigger.focus();
      trigger.click();
      yield* Effect.sleep(50);
      assert.strictEqual(dialog.open, true);
      focusCount = 0;

      yield* Dialog.close(state);
      yield* Effect.sleep(50);
      assert.strictEqual(dialog.open, false);
      assert.isAtLeast(focusCount, 1);
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("honors rendered dialog initial focus, final focus, and close policies", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const state = yield* Dialog.makeState({ open: false });
      const finalFocus = document.createElement("button");
      finalFocus.textContent = "Return";
      const dialog = yield* renderOne<HTMLDialogElement>(
        Dialog.Content({
          state,
          id: "preferences",
          label: "Preferences",
          initialFocus: "#first-field",
          finalFocus,
          closeOnEscape: false,
          closeOnOutsideInteraction: true,
          content: html`<input id="first-field" />`,
        }),
        root,
      );
      root.append(finalFocus);

      yield* Dialog.setOpen(state, true);
      yield* Effect.sleep(50);
      assert.strictEqual(dialog.open, true);
      assert.strictEqual(document.activeElement?.id, "first-field");

      dialog.dispatchEvent(new Event("cancel", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(50);
      assert.strictEqual((yield* state).open, true);
      assert.strictEqual(dialog.open, true);

      dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(50);
      assert.strictEqual((yield* state).open, false);
      assert.strictEqual(dialog.open, false);
      assert.strictEqual(document.activeElement, finalFocus);
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("honors rendered tooltip delay and hover grace policies", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const state = yield* Tooltip.makeState({ id: "help-tip", open: false });
      const anchor = yield* renderOne<HTMLElement>(
        Tooltip.Anchor({
          state,
          content: "Help",
          showDelay: 20,
          hideDelay: 40,
          hoverGrace: 40,
        }),
        root,
      );
      yield* renderOne<HTMLElement>(Tooltip.Content({ state, content: "Help text" }), root);

      anchor.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(10);
      assert.strictEqual((yield* state).open, false);
      yield* Effect.sleep(30);
      assert.strictEqual((yield* state).open, true);

      anchor.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(20);
      anchor.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(50);
      assert.strictEqual((yield* state).open, true);

      anchor.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(60);
      assert.strictEqual((yield* state).open, false);
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("selects a combobox item with keyboard interaction", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const items = [
        { id: "draft", value: "draft", textValue: "Draft" },
        { id: "published", value: "published", textValue: "Published" },
      ] as const;
      const state = yield* Combobox.makeState({ id: "status-combobox", value: "" });
      const input = yield* renderOne<HTMLInputElement>(Combobox.Input({ state, items }), root);
      yield* renderOne<HTMLElement>(Combobox.Popover({ state, content: "Options" }), root);

      input.focus();
      input.dispatchEvent(key("ArrowDown"));
      input.dispatchEvent(key("ArrowDown"));
      input.dispatchEvent(key("Enter"));
      yield* Effect.sleep(50);

      assert.strictEqual((yield* state).value, "published");
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("submits Select values through the hidden input", () =>
    Effect.gen(function* () {
      const form = document.createElement("form");
      document.body.append(form);
      const state = yield* Select.makeState({
        id: "status-select",
        value: "published",
        open: false,
      });

      yield* renderOne<HTMLInputElement>(Select.HiddenInput({ state, name: "status" }), form);
      assert.strictEqual(new FormData(form).get("status"), "published");
      form.remove();
    }).pipe(Effect.scoped, Effect.runPromise));
});

function appendRoot(): HTMLElement {
  const root = document.createElement("div");
  document.body.append(root);
  return root;
}

function key(value: string): KeyboardEvent {
  return new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: value });
}

function renderOne<Element extends globalThis.HTMLElement, Opts extends {} = {}>(
  component: Component<Opts>,
  root: globalThis.HTMLElement,
): Effect.Effect<Element, never, Scope.Scope> {
  return render(component, root).pipe(
    Fx.provide(DomRenderTemplate.using(document)),
    Fx.take(1),
    Fx.collectAll,
    Effect.map((elements) => {
      const element = elements[0];
      assert(element instanceof HTMLElement);
      return element as Element;
    }),
    Effect.orDie,
  );
}
