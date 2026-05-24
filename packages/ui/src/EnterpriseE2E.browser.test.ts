import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type * as Scope from "effect/Scope";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, EventHandler, html, render } from "@typed/template";
import * as Button from "./Button.js";
import * as Checkbox from "./Checkbox.js";
import * as Combobox from "./Combobox.js";
import * as Dialog from "./Dialog.js";
import * as Disclosure from "./Disclosure.js";
import * as Dom from "./Dom.js";
import * as Form from "./Form.js";
import * as Listbox from "./Listbox.js";
import * as Menu from "./Menu.js";
import * as Popover from "./Popover.js";
import * as RadioGroup from "./RadioGroup.js";
import * as Select from "./Select.js";
import * as Tabs from "./Tabs.js";
import * as Toolbar from "./Toolbar.js";
import type { Component } from "./Reactive.js";

describe("typed/ui enterprise browser e2e", () => {
  it("runs a settings dialog form lifecycle with validation, controls, submit, and reset", () =>
    Effect.gen(function* () {
      type SettingsValues = {
        readonly email: string;
        readonly role: string;
        readonly tags: readonly string[];
      };
      const root = appendRoot();
      const submitted: SettingsValues[] = [];
      const dialog = yield* Dialog.makeState({ open: false });
      const form = yield* Form.makeState<SettingsValues>({
        values: { email: "", role: "viewer", tags: ["core"] },
        schema: Schema.Struct({
          email: Schema.String.check(Schema.isMinLength(1)),
          role: Schema.String,
          tags: Schema.Array(Schema.String),
        }),
      });
      const marketing = yield* Checkbox.makeState({ checked: false });
      const density = yield* RadioGroup.makeState<"compact" | "comfortable">({
        value: "compact",
      });
      const role = yield* Select.makeState({ id: "settings-role", value: "viewer" });
      const densityItems = [
        { id: "density-compact", value: "compact", textValue: "Compact" },
        { id: "density-comfortable", value: "comfortable", textValue: "Comfortable" },
      ] as const;
      const trigger = yield* renderOne<HTMLButtonElement>(
        Dialog.Trigger({ state: dialog, controls: "settings-dialog", content: "Settings" }),
        appendMount(root),
      );
      const formElement = yield* renderOne<HTMLFormElement>(
        Form.Form({
          state: form,
          onValidSubmit: (values) =>
            Effect.sync(() => {
              submitted.push(values);
            }),
          content: html`
            ${Form.Input({ state: form, name: "email", id: "settings-email" })}
            ${Select.HiddenInput({ state: role, formState: form, name: "role" })}
            ${Checkbox.Input({ state: marketing, name: "marketing", value: "yes" })}
            ${RadioGroup.Root({
              state: density,
              items: densityItems,
              content: html`
                ${RadioGroup.Item({
                  state: density,
                  id: "density-compact",
                  value: "compact",
                  content: "Compact",
                })}
                ${RadioGroup.Item({
                  state: density,
                  id: "density-comfortable",
                  value: "comfortable",
                  content: "Comfortable",
                })}
              `,
            })}
            ${Form.Push({ state: form, name: "tags", value: "beta", content: "Add beta" })}
            ${Form.Remove({ state: form, name: "tags", index: 0, content: "Remove first tag" })}
            ${Form.Submit({ content: "Save" })}
            ${Form.Reset({ content: "Reset" })}
          `,
        }),
        appendMount(root),
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
      const admin = yield* renderOne<HTMLElement>(
        Select.Option({ state: role, id: "admin", value: "admin", content: "Admin" }),
        appendMount(root),
      );
      yield* Effect.sleep(30);

      trigger.click();
      yield* Effect.sleep(50);
      assert.strictEqual(dialogElement.open, true);

      formElement.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(30);
      assert.strictEqual(submitted.length, 0);
      assert.ok((yield* form).errors.email);

      const email = formElement.querySelector<HTMLInputElement>("#settings-email");
      const marketingInput = formElement.querySelector<HTMLInputElement>("input[name=marketing]");
      const comfortable = formElement.querySelector<HTMLElement>("#density-comfortable");
      const add = buttonNamed(formElement, "Add beta");
      const remove = buttonNamed(formElement, "Remove first tag");
      assert(email);
      assert(marketingInput);
      assert(comfortable);

      email.value = "editor@example.com";
      email.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
      marketingInput.click();
      comfortable.click();
      add.click();
      remove.click();
      admin.click();
      yield* Effect.sleep(50);

      assert.strictEqual((yield* marketing).checked, true);
      assert.strictEqual((yield* density).value, "comfortable");
      assert.deepStrictEqual((yield* form).values, {
        email: "editor@example.com",
        role: "admin",
        tags: ["beta"],
      });
      assert.strictEqual(new FormData(formElement).get("marketing"), "yes");

      formElement.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(30);
      assert.deepStrictEqual(submitted, [
        { email: "editor@example.com", role: "admin", tags: ["beta"] },
      ]);
      assert.strictEqual((yield* form).submitting, false);

      formElement.dispatchEvent(new Event("reset", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(30);
      assert.deepStrictEqual((yield* form).values, { email: "", role: "viewer", tags: ["core"] });
      assert.deepStrictEqual((yield* form).errors, {});

      yield* Dialog.close(dialog);
      yield* Effect.sleep(150);
      assert.strictEqual(document.activeElement, trigger);
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("runs a dialog form with Form wrappers, Select state, Checkbox state, and Popover help", () =>
    Effect.gen(function* () {
      type Preferences = {
        readonly marketing: boolean;
        readonly role: "viewer" | "admin";
      };
      const root = appendRoot();
      const submitted: Preferences[] = [];
      const dialog = yield* Dialog.makeState({ open: false });
      const popover = yield* Popover.makeState({ id: "preferences-help", open: false, mode: "auto" });
      const role = yield* Select.makeState<"viewer" | "admin">({
        id: "preferences-role",
        value: "viewer",
      });
      const form = yield* Form.makeState<Preferences>({
        values: { marketing: false, role: "viewer" },
        schema: Schema.Struct({
          marketing: Schema.Boolean,
          role: Schema.Literals(["viewer", "admin"]),
        }),
      });
      const trigger = yield* renderOne<HTMLButtonElement>(
        Dialog.Trigger({ state: dialog, controls: "preferences-dialog", content: "Preferences" }),
        appendMount(root),
      );
      const dialogElement = yield* renderOne<HTMLDialogElement>(
        Dialog.Content({
          state: dialog,
          id: "preferences-dialog",
          label: "Preferences",
          finalFocus: trigger,
          content: html`
            ${Form.Form({
              state: form,
              onValidSubmit: (values) =>
                Effect.sync(() => {
                  submitted.push(values);
                }),
              content: html`
                ${Form.Checkbox(form, "marketing", {
                  id: "marketing",
                  value: "yes",
                })}
                ${Form.Select(form, "role", { state: role })}
                ${Popover.Trigger({ state: popover, content: "Why role matters" })}
                ${Form.Submit({ content: "Save preferences" })}
              `,
            })}
            ${Popover.Content({
              state: popover,
              positionAnchor: "--preferences-help",
              positionArea: "bottom",
              content: html`
                Role controls access.
                ${Popover.Dismiss({ state: popover, content: "Close help" })}
              `,
            })}
          `,
        }),
        appendMount(root),
      );
      const adminOption = yield* renderOne<HTMLElement>(
        Select.Option({ state: role, id: "admin", value: "admin", content: "Admin" }),
        appendMount(root),
      );
      yield* Effect.sleep(30);

      trigger.focus();
      trigger.click();
      yield* Effect.sleep(50);
      assert.strictEqual(dialogElement.open, true);

      const formElement = dialogElement.querySelector("form");
      const marketing = dialogElement.querySelector<HTMLInputElement>("#marketing");
      const hiddenRole = dialogElement.querySelector<HTMLInputElement>("input[name=role]");
      const helpContent = dialogElement.querySelector<HTMLElement>("#preferences-help");
      assert(formElement instanceof HTMLFormElement);
      assert(marketing instanceof HTMLInputElement);
      assert(hiddenRole instanceof HTMLInputElement);
      assert(helpContent instanceof HTMLElement);

      buttonNamed(dialogElement, "Why role matters").click();
      yield* Effect.sleep(50);
      assert.strictEqual((yield* popover).open, true);
      assert.strictEqual(helpContent.dataset.open, "true");

      buttonNamed(helpContent, "Close help").click();
      marketing.click();
      adminOption.click();
      yield* Effect.sleep(50);

      assert.deepStrictEqual((yield* form).values, { marketing: true, role: "admin" });
      assert.strictEqual(hiddenRole.value, "admin");
      assert.strictEqual(new FormData(formElement).get("role"), "admin");

      buttonNamed(formElement, "Save preferences").click();
      yield* Effect.sleep(50);
      assert.deepStrictEqual(submitted, [{ marketing: true, role: "admin" }]);

      yield* Dialog.close(dialog);
      yield* Effect.sleep(150);
      assert.strictEqual(document.activeElement, trigger);
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("runs a command surface with native menu trigger, disabled-item navigation, and Fx combobox items", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const menuItems = [
        { id: "new", textValue: "New file" },
        { id: "disabled-archive", textValue: "Archive", disabled: true },
        { id: "delete", textValue: "Delete" },
      ] as const;
      const commandItems = Fx.succeed([
        { id: "open", value: "open", textValue: "Open project" },
        { id: "publish", value: "publish", textValue: "Publish project" },
        { id: "delete", value: "delete", textValue: "Delete project" },
      ] as const);
      const menu = yield* Menu.makeState({ id: "command-menu", virtualFocus: true });
      const combobox = yield* Combobox.makeState({ id: "command-combobox", value: "" });
      const trigger = yield* renderOne<HTMLButtonElement>(
        Menu.Trigger({ state: menu, content: "Commands" }),
        appendMount(root),
      );
      const content = yield* renderOne<HTMLElement>(
        Menu.Content({
          state: menu,
          items: menuItems,
          content: html`
            ${Menu.Item({ state: menu, id: "new", content: "New file" })}
            ${Menu.Item({
              state: menu,
              id: "disabled-archive",
              disabled: true,
              content: "Archive",
            })}
            ${Menu.Item({ state: menu, id: "delete", content: "Delete" })}
          `,
        }),
        appendMount(root),
      );
      const input = yield* renderOne<HTMLInputElement>(
        Combobox.Input({
          state: combobox,
          items: commandItems,
          autocomplete: "both",
          autoSelect: true,
          filter: (item, query) => item.textValue?.toLowerCase().startsWith(query.toLowerCase()) ?? false,
        }),
        appendMount(root),
      );

      trigger.click();
      yield* Effect.sleep(50);
      assert.strictEqual((yield* menu).open, true);
      assert.strictEqual(content.getAttribute("data-open"), "true");

      content.dispatchEvent(key("ArrowDown"));
      content.dispatchEvent(key("ArrowDown"));
      yield* Effect.sleep(30);
      assert.strictEqual((yield* menu).activeId, "delete");
      assert.strictEqual(content.getAttribute("aria-activedescendant"), "delete");

      content.dispatchEvent(key("n"));
      yield* Effect.sleep(30);
      assert.strictEqual((yield* menu).activeId, "new");

      input.value = "Pub";
      input.dispatchEvent(new InputEvent("input", { bubbles: true, cancelable: true }));
      yield* Effect.sleep(30);
      assert.strictEqual((yield* combobox).activeId, "publish");
      assert.strictEqual((yield* combobox).value, "publish");
      assert.strictEqual(input.getAttribute("aria-activedescendant"), "publish");

      input.dispatchEvent(key("Escape"));
      yield* Effect.sleep(30);
      assert.strictEqual((yield* combobox).open, false);
      assert.strictEqual(input.getAttribute("aria-expanded"), "false");
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

  it("runs navigation and overlay controls through rendered tabs, disclosure, and popover DOM", () =>
    Effect.gen(function* () {
      const root = appendRoot();
      const tabs = yield* Tabs.makeState({ selectedId: "overview" });
      const disclosure = yield* Disclosure.makeState({ open: false });
      const popover = yield* Popover.makeState({ id: "help-popover", open: false, mode: "auto" });
      const tabItems = [
        { id: "overview", textValue: "Overview" },
        { id: "settings", textValue: "Settings" },
      ] as const;
      const tablist = yield* renderOne<HTMLElement>(
        Tabs.List({
          state: tabs,
          items: tabItems,
          content: html`
            ${Tabs.Tab({
              state: tabs,
              id: "overview",
              panelId: "overview-panel",
              content: "Overview",
            })}
            ${Tabs.Tab({
              state: tabs,
              id: "settings",
              panelId: "settings-panel",
              content: "Settings",
            })}
          `,
        }),
        appendMount(root),
      );
      const overviewPanel = yield* renderOne<HTMLElement>(
        Tabs.Panel({
          state: tabs,
          id: "overview-panel",
          tabId: "overview",
          content: "Overview panel",
        }),
        appendMount(root),
      );
      const settingsPanel = yield* renderOne<HTMLElement>(
        Tabs.Panel({
          state: tabs,
          id: "settings-panel",
          tabId: "settings",
          content: "Settings panel",
        }),
        appendMount(root),
      );
      const disclosureButton = yield* renderOne<HTMLButtonElement>(
        Disclosure.Button({
          state: disclosure,
          controls: "advanced-settings",
          content: "Advanced",
        }),
        appendMount(root),
      );
      const disclosureContent = yield* renderOne<HTMLElement>(
        Disclosure.Content({
          state: disclosure,
          id: "advanced-settings",
          content: "Advanced settings",
        }),
        appendMount(root),
      );
      const popoverTrigger = yield* renderOne<HTMLButtonElement>(
        Popover.Trigger({ state: popover, content: "Help" }),
        appendMount(root),
      );
      const popoverContent = yield* renderOne<HTMLElement>(
        Popover.Content({
          state: popover,
          positionAnchor: "--help",
          positionArea: "bottom",
          content: html`${Popover.Dismiss({ state: popover, content: "Close help" })}`,
        }),
        appendMount(root),
      );
      yield* Effect.sleep(30);

      tablist.dispatchEvent(key("ArrowRight"));
      yield* Effect.sleep(30);
      assert.strictEqual((yield* tabs).selectedId, "settings");
      assert.strictEqual(overviewPanel.hidden, true);
      assert.strictEqual(settingsPanel.hidden, false);

      disclosureButton.click();
      yield* Effect.sleep(30);
      assert.strictEqual((yield* disclosure).open, true);
      assert.strictEqual(disclosureButton.getAttribute("aria-expanded"), "true");
      assert.strictEqual(disclosureContent.hidden, false);

      popoverTrigger.click();
      yield* Effect.sleep(50);
      assert.strictEqual((yield* popover).open, true);
      assert.strictEqual(popoverContent.dataset.positionAnchor, "--help");
      assert.strictEqual(popoverContent.dataset.positionArea, "bottom");

      buttonNamed(popoverContent, "Close help").click();
      yield* Effect.sleep(50);
      assert.strictEqual((yield* popover).open, false);
      assert.strictEqual(popoverTrigger.getAttribute("aria-expanded"), "false");
      root.remove();
    }).pipe(Effect.scoped, Effect.runPromise));

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
      trigger.click();
      yield* Effect.sleep(50);
      assert.strictEqual(dialogElement.open, true);

      option.click();
      yield* Effect.sleep(30);
      assert.strictEqual((yield* select).value, "admin");
      assert.strictEqual((yield* form).values.role, "admin");
      assert.strictEqual(new FormData(formElement).get("role"), "admin");

      yield* Dialog.close(dialog);
      yield* Effect.sleep(150);
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

function buttonNamed(root: ParentNode, name: string): HTMLButtonElement {
  const button = Array.from(root.querySelectorAll("button")).find(
    (element) => element.textContent === name,
  );
  assert(button instanceof HTMLButtonElement, `Expected button named ${name}`);
  return button;
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
