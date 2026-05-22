# Spec - Typed UI Listbox Layer

## Architecture

`Listbox` is a single-selection component substrate.

- `makeState(initial)` creates direct `RefSubject` state.
- `Root(options)` renders `role="listbox"`, optional `id` and `aria-label`, `aria-orientation`, optional `aria-activedescendant` for virtual focus, and content.
- `Option(options)` renders `role="option"`, `aria-selected`, `aria-disabled`, roving `tabindex`, and public `data-selected`, `data-active`, and `data-disabled`.
- `select(state, id, value)` updates selected `value` and `activeId`.
- `move(state, items, direction)` updates only `activeId` and leaves selected `value` unchanged.

## Boundaries

This first slice is single-select only. Select and Combobox will compose it later. Multi-select, typeahead, option groups, and virtualization are deferred.
