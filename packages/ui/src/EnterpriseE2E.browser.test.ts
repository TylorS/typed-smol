import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import type * as Scope from "effect/Scope";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, EventHandler, html, render } from "@typed/template";
import * as Button from "./Button.js";
import * as Combobox from "./Combobox.js";
import * as Dialog from "./Dialog.js";
import * as Dom from "./Dom.js";
import * as Form from "./Form.js";
import * as Listbox from "./Listbox.js";
import * as Menu from "./Menu.js";
import * as RadioGroup from "./RadioGroup.js";
import * as Select from "./Select.js";
import * as Tabs from "./Tabs.js";
import * as Toolbar from "./Toolbar.js";
import type { Component } from "./Reactive.js";

describe("typed/ui enterprise browser e2e", () => {
  it("persists a dialog settings flow through Select hidden input and Form state", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const dialog = yield* Dialog.makeState({ open: false });
      const select = yield* Select.makeState({ id: "role-select", value: "viewer", open: false });
      const form = yield* Form.makeState({ values: { role: "viewer" } });
      const trigger = yield* renderOne<HTMLButtonElement>(
        Dialog.Trigger({ state: dialog, controls: "settings-dialog", content: "Settings" }),
        appendMount(root),
      );
      const formElement = yield* renderOne<HTMLFormElement>(
        Form.Form({
          state: form,
          props: { id: "settings-form" },
          content: "Settings form",
        }),
        appendMount(root),
      );
      yield* renderOne<HTMLInputElement>(
        Select.HiddenInput({ state: select, formState: form, name: "role" }),
        formElement,
      );
      const dialogElement = yield* renderOne<HTMLDialogElement>(
        Dialog.Content({
          state: dialog,
          id: "settings-dialog",
          label: "Settings",
          finalFocus: trigger,
          content: "Settings panel",
        }),
        appendMount(root),
      );
      const option = yield* renderOne<HTMLElement>(
        Select.Option({ state: select, id: "admin", value: "admin", content: "Admin" }),
        appendMount(root),
      );
      yield* Effect.sleep(30);

      trigger.focus();
      yield* Dialog.setOpen(dialog, true);
      yield* Effect.sleep(50);
      assert.strictEqual(dialogElement.open, true);

      option.click();
      yield* Effect.sleep(30);
      assert.strictEqual((yield* select).value, "admin");
      assert.strictEqual((yield* form).values.role, "admin");
      assert.strictEqual(new FormData(formElement).get("role"), "admin");

      yield* Dialog.close(dialog);
      yield* Effect.sleep(30);
      assert.strictEqual(dialogElement.open, false);
      assert.strictEqual(document.activeElement, trigger);
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("filters, autocompletes, selects, and cancels a Combobox with DOM input events", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const items = [
        { id: "draft", value: "draft", textValue: "Draft" },
        { id: "published", value: "published", textValue: "Published" },
        { id: "archived", value: "archived", textValue: "Archived" },
      ] as const;
      const state = yield* Combobox.makeState({ id: "article-status", value: "" });
      const input = yield* renderOne<HTMLInputElement>(
        Combobox.Input({
          state,
          items,
          autocomplete: "both",
          autoSelect: true,
          filter: (item, query) => item.textValue?.toLowerCase().startsWith(query.toLowerCase()) ?? false,
        }),
        root,
      );
      const cancel = yield* renderOne<HTMLButtonElement>(
        Combobox.Cancel({ state, content: "Clear" }),
        root,
      );

      input.value = "Pub";
      input.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(30);
      assert.deepStrictEqual((yield* state).filteredItems.map((item) => item.id), ["published"]);
      assert.strictEqual((yield* state).activeId, "published");
      assert.strictEqual((yield* state).value, "published");

      input.dispatchEvent(key("Enter"));
      yield* Effect.sleep(30);
      assert.strictEqual((yield* state).open, false);
      assert.strictEqual((yield* state).value, "published");

      cancel.click();
      yield* Effect.sleep(30);
      assert.strictEqual((yield* state).value, "");
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("drives Menu, Listbox, Tabs, RadioGroup, and Toolbar keyboard policies", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const items = [
        { id: "draft", value: "draft", textValue: "Draft" },
        { id: "published", value: "published", textValue: "Published" },
        { id: "archived", value: "archived", textValue: "Archived" },
      ] as const;
      type StatusValue = (typeof items)[number]["value"];
      const menu = yield* Menu.makeState({ id: "actions", virtualFocus: true });
      const listbox = yield* Listbox.makeState({ virtualFocus: true });
      const tabs = yield* Tabs.makeState({ selectedId: "draft" });
      const manualTabs = yield* Tabs.makeState({
        selectedId: "draft",
        activationMode: "manual",
      });
      const radio = yield* RadioGroup.makeState<StatusValue>({ value: "draft" });
      const toolbarRadio = yield* RadioGroup.makeState<StatusValue>({
        value: "draft",
        toolbar: true,
      });
      const toolbar = yield* Toolbar.makeState({ activeId: "draft" });

      const menuElement = yield* renderOne<HTMLElement>(
        Menu.Content({ state: menu, items, content: "Actions" }),
        root,
      );
      const listboxElement = yield* renderOne<HTMLElement>(
        Listbox.Root({ state: listbox, items, content: "Statuses" }),
        root,
      );
      const tablist = yield* renderOne<HTMLElement>(
        Tabs.List({ state: tabs, items, content: "Tabs" }),
        root,
      );
      const manualTablist = yield* renderOne<HTMLElement>(
        Tabs.List({ state: manualTabs, items, content: "Manual tabs" }),
        root,
      );
      const radioGroup = yield* renderOne<HTMLElement>(
        RadioGroup.Root({ state: radio, items, content: "Visibility" }),
        root,
      );
      const toolbarRadioGroup = yield* renderOne<HTMLElement>(
        RadioGroup.Root({ state: toolbarRadio, items, content: "Toolbar radios" }),
        root,
      );
      const toolbarElement = yield* renderOne<HTMLElement>(
        Toolbar.Root({ state: toolbar, items, content: "Editor toolbar" }),
        root,
      );

      menuElement.dispatchEvent(key("ArrowDown"));
      menuElement.dispatchEvent(key("p"));
      listboxElement.dispatchEvent(key("End"));
      tablist.dispatchEvent(key("ArrowRight"));
      manualTablist.dispatchEvent(key("ArrowRight"));
      radioGroup.dispatchEvent(key("ArrowRight"));
      toolbarRadioGroup.dispatchEvent(key("ArrowRight"));
      toolbarElement.dispatchEvent(key("End"));
      yield* Effect.sleep(30);

      assert.strictEqual((yield* menu).activeId, "published");
      assert.strictEqual((yield* listbox).activeId, "archived");
      assert.strictEqual((yield* tabs).selectedId, "published");
      assert.strictEqual((yield* manualTabs).activeId, "published");
      assert.strictEqual((yield* manualTabs).selectedId, "draft");
      assert.strictEqual((yield* radio).value, "published");
      assert.strictEqual((yield* toolbarRadio).activeId, "published");
      assert.strictEqual((yield* toolbarRadio).value, "draft");
      assert.strictEqual((yield* toolbar).activeId, "archived");
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("keeps user events ahead of internal handlers at component boundaries", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const state = yield* Select.makeState({ id: "guarded-select", value: "draft" });
      let userClicks = 0;
      const option = yield* renderOne<HTMLElement>(
        Select.Option({
          state,
          id: "published",
          value: "published",
          content: "Published",
          props: {
            onclick: EventHandler.make((event: MouseEvent) => {
              userClicks += 1;
              event.preventDefault();
            }),
          },
        }),
        root,
      );

      option.click();
      yield* Effect.sleep(30);
      assert.strictEqual(userClicks, 1);
      assert.strictEqual((yield* state).value, "draft");
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("runs host-provided components with user refs, events, and internal behavior", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const button = yield* renderOne<HTMLButtonElement>(
        Button.Button({
          content: "Save",
          props: {
            id: "save-button",
            ref: (element) => Effect.sync(() => {
              element.dataset.ready = "true";
            }),
          },
          host: (props, content) => {
            const split = Dom.splitRef(props);
            return html`<button ...${split.props} ref=${split.ref}>${content}</button>`;
          },
        }),
        root,
      );

      assert.strictEqual(button.id, "save-button");
      assert.strictEqual(button.type, "button");
      yield* Effect.sleep(30);
      assert.strictEqual(button.dataset.ready, "true");
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));
});

function appendRoot(): HTMLElement {
  const root = document.createElement("div");
  document.body.append(root);
  return root;
}

function appendMount(root: HTMLElement): HTMLElement {
  const mount = document.createElement("div");
  root.append(mount);
  return mount;
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
  ) as Effect.Effect<Element, never, Scope.Scope>;
}
