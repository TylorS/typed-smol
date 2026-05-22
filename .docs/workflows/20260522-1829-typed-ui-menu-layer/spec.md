# Spec - Typed UI Menu Layer

## Architecture

`Menu` composes the existing UI substrate without adding a new store abstraction.

- `Menu.makeState(initial)` creates a scoped `RefSubject.RefSubject<Menu.State>`.
- `Menu.Trigger(options)` renders a button with `popovertarget`, `popovertargetaction="toggle"`, `aria-haspopup="menu"`, `aria-expanded`, and public `data-open`.
- `Menu.Content(options)` renders an element with `role="menu"`, native `popover`, `aria-orientation`, optional `aria-activedescendant`, and public `data-open`. It mirrors native `toggle` events into the backing state.
- `Menu.Item(options)` renders `role="menuitem"`, `aria-disabled`, roving `tabindex`, and public `data-active` / `data-disabled`.
- `Menu.move(state, items, direction)` uses `Collection.enabledItems`, `Collection.byDomOrder`, and Composite-style movement rules.

## Boundaries

This slice intentionally does not implement submenus, typeahead, checkbox/radio menu items, Listbox, Select, or Combobox. It creates the first layered primitive needed for those later components.

## Native Platform Direction

Menu layering uses only the HTML Popover API. CSS Anchor Positioning remains the future positioning mechanism through stable DOM attributes and user-authored CSS.
