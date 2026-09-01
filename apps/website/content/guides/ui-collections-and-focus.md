---
title: UI collections, focus, and keyboard behavior
summary: Understand the Collection and Composite contracts shared by menus, tabs, comboboxes, trees, grids, and toolbars.
section: UI
kind: deep-dive
order: 4.2
---

A composite is a widget whose items share one keyboard and focus contract. Build it from a family
rather than assembling roles and key handlers yourself. This guide builds a formatting toolbar: a
registered collection of commands with real roving focus. The same division—state for the active
identity and a collection for mounted items—also underpins Listbox, Tabs, Menu, Grid, and Tree.

## Build one toolbar from public parts

The caller owns the live command list. The toolbar creates its own short-lived interaction state and
registry when it is rendered. Each `Toolbar.Item` supplies a stable item ID; its rendered ref
registers that ID and its actual element in `collection`.

```ts
import { RefSubject } from "@typed/fx";
import { many } from "@typed/template";
import { component } from "@typed/ui";
import * as Toolbar from "@typed/ui/Toolbar";

interface Command {
  readonly id: string;
  readonly label: string;
}

interface FormattingToolbarProps {
  readonly commands: RefSubject.RefSubject<ReadonlyArray<Command>>;
}

export const FormattingToolbar = component(function* (props: FormattingToolbarProps) {
  const state = yield* Toolbar.makeState({ activeId: "bold" });
  const collection = yield* Toolbar.makeCollection();

  const items = many(
    props.commands,
    (command) => command.id,
    (command, id) =>
      Toolbar.Item({
        state,
        collection,
        id,
        content: RefSubject.map(command, (current) => current.label),
      }),
  );

  return Toolbar.Root({
    state,
    collection,
    label: "Formatting",
    content: items,
  });
});
```

`activeId` is the keyboard identity, not an element or array position. `collection` is the mounted
registry: an item contains that identity, its live DOM element, disabled state, and optional search
text. Movement uses enabled registered items in DOM order, not the order in which registration
Effects happened to run.

Each keyed item owns its collection registration. When an item leaves the live list, that
registration is removed. If another render replaces the same ID, the older cleanup cannot remove
the newer registration.

## Use IDs as the contract for dynamic items

`many` preserves one rendered range for each command ID. Adding, removing, or reordering commands
therefore preserves retained controls and lets the collection read their new DOM order. IDs must be
unique and stable for the command's logical lifetime—never use an array index for a list that can
move.

```ts
import { RefSubject } from "@typed/fx";

interface Command {
  readonly id: string;
  readonly label: string;
}

const addUnderline = (commands: RefSubject.RefSubject<ReadonlyArray<Command>>) =>
  RefSubject.update(commands, (current) => [...current, { id: "underline", label: "Underline" }]);
```

The family registers and unregisters rendered items; application code updates the domain list. If an
update removes the active command, the component that owns the toolbar state must choose a successor
and update `activeId` as part of that interaction. A collection reports what is mounted; it does not
invent a domain policy for a disappearing command.

## Know where focus actually lives

`Toolbar` implements roving DOM focus. Its root receives focus only to establish an initial active
item; it then focuses that item. The active item receives `tabindex="0"`; other items receive `-1`.
Arrow keys move according to the configured orientation (horizontal by default), `Home` and `End`
move to the bounds, looping and RTL are honored, and disabled items are skipped. `Enter` and `Space`
activate the current role-button item.

That is deliberately different from a combobox. `Combobox.Input` keeps browser focus in the native
input and renders the active option through `aria-activedescendant`; its option elements are not the
focused element. Do not add `aria-activedescendant` to this toolbar: `Toolbar.Root` moves real focus.
Choose the component family whose focus model matches the interaction, rather than toggling a shared
low-level setting after the fact.

## Test state and browser behavior at their boundaries

The collection unit tests prove registration ownership, replacement safety, disabled filtering, and
DOM ordering. Browser tests prove the browser-owned boundary: native key delivery and the actual
focused node. This is the focused toolbar pattern used by the package tests.

```ts
import { Effect } from "effect";
import { Fx } from "@typed/fx";
import { DomRenderTemplate, render } from "@typed/template";
import { assert, it } from "vitest";
import * as Toolbar from "@typed/ui/Toolbar";

it("moves focus through enabled commands", async () => {
  document.body.replaceChildren();

  await Effect.gen(function* () {
    const state = yield* Toolbar.makeState({ activeId: "bold" });
    const collection = yield* Toolbar.makeCollection();

    yield* render(
      Toolbar.Root({
        state,
        collection,
        label: "Formatting",
        content: [
          Toolbar.Item({ state, collection, id: "bold", content: "Bold" }),
          Toolbar.Item({
            state,
            collection,
            id: "separator",
            disabled: true,
            content: "Separator",
          }),
          Toolbar.Item({ state, collection, id: "italic", content: "Italic" }),
        ],
      }),
      document.body,
    ).pipe(Fx.take(1), Fx.drain);

    const bold = document.querySelector("#bold") as HTMLDivElement;
    const italic = document.querySelector("#italic") as HTMLDivElement;
    bold.focus();
    bold.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    yield* Effect.sleep(0);

    const currentState = yield* state;
    assert.strictEqual(currentState.activeId, "italic");
    assert.strictEqual(document.activeElement, italic);
  }).pipe(Effect.provide(DomRenderTemplate.using(document)), Effect.scoped, Effect.runPromise);
});
```

For a dynamic-list test, update `commands`, wait for the rendered change, then assert the registered
IDs or DOM order and—when a retained item had focus—that the same DOM node is still focused. For
`Combobox`, assert the inverse focus relationship: the input remains
`document.activeElement` while its `aria-activedescendant` changes.
