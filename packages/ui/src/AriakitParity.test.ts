import { assert, describe, it } from "vitest";
import * as Effect from "effect/Effect";
import { Fx, RefSubject } from "@typed/fx";
import { DomRenderTemplate, html, render } from "@typed/template";
import { Window } from "happy-dom";
import * as Button from "./Button.js";
import * as Combobox from "./Combobox.js";
import * as Command from "./Command.js";
import * as Focusable from "./Focusable.js";
import * as Form from "./Form.js";
import * as Group from "./Group.js";
import * as Heading from "./Heading.js";
import * as Hovercard from "./Hovercard.js";
import * as Menubar from "./Menubar.js";
import * as Radio from "./Radio.js";
import * as Role from "./Role.js";
import * as Separator from "./Separator.js";
import * as Tooltip from "./Tooltip.js";
import * as VisuallyHidden from "./VisuallyHidden.js";
import * as Checkbox from "./Checkbox.js";
import * as Dialog from "./Dialog.js";
import * as Menu from "./Menu.js";
import * as Popover from "./Popover.js";
import * as Select from "./Select.js";
import * as Tab from "./Tab.js";
import * as Toolbar from "./Toolbar.js";

describe("typed/ui Ariakit parity exports", () => {
  it("renders missing primitive families and common subparts", () =>
    Effect.gen(function* () {
      const [window, layer] = createHappyDomLayer();
      const checkbox = yield* Checkbox.makeState({ checked: true });
      const combobox = yield* Combobox.makeState<string>({ value: "Apple", open: true });
      const dialog = yield* Dialog.makeState({ open: true });
      const form = yield* Form.makeState<{ email: string }>({ values: { email: "" } });
      const hovercard = yield* Hovercard.makeState({ id: "profile-card", open: true });
      const menu = yield* Menu.makeState({ id: "file-menu", open: true });
      const menubar = yield* Menubar.makeState();
      const popover = yield* Popover.makeState({ id: "invite-popover", open: true, mode: "auto" });
      const radio = yield* Radio.makeState<string>({ value: "one", activeId: "one" });
      const radioValue = RefSubject.map(radio, (state) => state.value);
      const select = yield* Select.makeState<string>({
        id: "fruit-select",
        value: "Apple",
        open: true,
      });
      const tabs = yield* Tab.makeState({ selectedId: "one" });
      const toolbar = yield* Toolbar.makeState();
      const tooltip = yield* Tooltip.makeState({ id: "tip", open: true });

      yield* render(
        html`${Button.Button({ content: "Button" })} ${Command.Command({ content: "Command" })}
        ${Focusable.Focusable({ content: "Focusable" })}
        ${Group.Group({ label: "Group", content: Group.Label({ content: "Label" }) })}
        ${Heading.Heading({ level: 2, content: "Heading" })}
        ${Role.Role({ role: "note", content: "Role" })} ${Separator.Separator()}
        ${VisuallyHidden.VisuallyHidden({ content: "Hidden" })}
        ${Checkbox.Check({ state: checkbox, content: "check" })}
        ${Combobox.Label({ for: "fruit", content: "Fruit" })}
        ${Combobox.Input({ state: combobox, id: "fruit" })}
        ${Combobox.Disclosure({ state: combobox, content: "Open" })}
        ${Combobox.Cancel({ state: combobox, content: "Clear" })}
        ${Combobox.Value({ state: combobox })}
        ${Combobox.Popover({
          state: combobox,
          content: html`${Combobox.Group({
            label: "Options",
            content: html`${Combobox.Item({ state: combobox, id: "apple", value: "Apple" })}
            ${Combobox.Row({ content: "row" })} ${Combobox.Separator()}`,
          })}`,
        })}
        ${Dialog.Dialog({ state: dialog, label: "Dialog", content: "Dialog body" })}
        ${Dialog.Disclosure({ state: dialog, content: "Open dialog" })}
        ${Dialog.Heading({ id: "dialog-title", content: "Dialog title" })}
        ${Dialog.Description({ id: "dialog-desc", content: "Dialog description" })}
        ${Dialog.Dismiss({ state: dialog, content: "Dismiss" })}
        ${Form.Form({ state: form, content: Form.Input({ state: form, name: "email" }) })}
        ${Form.Label({ for: "email", content: "Email" })}
        ${Form.Description({ id: "email-help", content: "Help" })}
        ${Form.Error({ state: form, name: "email" })} ${Form.Submit({ content: "Submit" })}
        ${Hovercard.Anchor({ state: hovercard, content: "Anchor" })}
        ${Hovercard.Content({ state: hovercard, content: Hovercard.Arrow() })}
        ${Hovercard.Disclosure({ state: hovercard, content: "More" })}
        ${Hovercard.Dismiss({ state: hovercard, content: "Close" })}
        ${Menu.Button({ state: menu, content: "File" })}
        ${Menu.Menu({
          state: menu,
          content: html`${Menu.Group({
            label: "File actions",
            content: html`${Menu.ItemCheckbox({
              state: menu,
              id: "autosave",
              checked: true,
              content: "Autosave",
            })}
            ${Menu.ItemRadio({ state: menu, id: "small", checked: false, content: "Small" })}
            ${Menu.Separator()}`,
          })}
          ${Menu.MenuArrow()} ${Menu.MenuButtonArrow()}`,
        })}
        ${Menubar.Root({
          state: menubar,
          content: Menubar.Item({ state: menubar, id: "file", content: "File" }),
        })}
        ${Menubar.Menubar({ state: menubar, content: "Menubar" })}
        ${Popover.Popover({ state: popover, content: "Popover" })}
        ${Popover.Anchor({ state: popover, content: "Anchor" })} ${Popover.PopoverDisclosureArrow()}
        ${Popover.Dismiss({ state: popover, content: "Close" })}
        ${Popover.Heading({ content: "Heading" })}
        ${Popover.Description({ content: "Description" })}
        ${Radio.Root({
          state: radio,
          label: "Radio",
          content: Radio.Item({ state: radio, id: "one", value: "one", content: "One" }),
        })}
        ${radioValue} ${Select.Label({ for: "fruit-select", content: "Fruit" })}
        ${Select.Value({ state: select })} ${Select.Arrow()}
        ${Select.List({
          state: select,
          content: html`${Select.Group({
            label: "Fruit",
            content: html`${Select.Option({
              state: select,
              id: "apple-select",
              value: "Apple",
              content: "Apple",
            })}
            ${Select.ItemCheck({ selected: true, content: "check" })} ${Select.Separator()}`,
          })}`,
        })}
        ${Select.Dismiss({ state: select, content: "Close" })}
        ${Tab.Tab({ state: tabs, id: "one", panelId: "panel-one", content: "Tab" })}
        ${Tab.Panel({ state: tabs, id: "panel-one", tabId: "one", content: "Panel" })}
        ${Toolbar.Toolbar({ state: toolbar, content: "Toolbar" })}
        ${Toolbar.Item({ state: toolbar, id: "bold", content: "Bold" })}
        ${Toolbar.Container({ content: "Container" })} ${Toolbar.Separator()}
        ${Tooltip.Anchor({ state: tooltip, content: "Anchor" })}
        ${Tooltip.Content({ state: tooltip, content: Tooltip.Arrow() })}`,
        window.document.body,
      ).pipe(Fx.provide(layer), Fx.take(1), Fx.collectAll);

      assert(window.document.querySelector("button"));
      assert(window.document.querySelector("[role=separator]"));
      assert(window.document.getElementById("fruit"));
      assert(window.document.querySelector("dialog"));
    }).pipe(Effect.scoped, Effect.runPromise));

  it("does not export removed overlay shims", async () => {
    const ui = await import("./index.js");

    assert(!("FocusTrap" in ui));
    assert(!("Portal" in ui));
    assert(!("Store" in ui));
  });
});

function createHappyDomLayer(...params: ConstructorParameters<typeof Window>) {
  const window = new Window(...params) as unknown as globalThis.Window & typeof globalThis;
  const layer = DomRenderTemplate.using(window.document);
  return [window, layer] as const;
}
