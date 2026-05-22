# Spec - Typed UI Select Layer

## Architecture

`Select` composes native Popover layering with Listbox option semantics.

- `makeState(initial)` creates direct `RefSubject` state containing popup id, selected value, active id, orientation, loop, virtual focus, open state, and popover mode.
- `Trigger(options)` renders a button with `popovertarget`, `popovertargetaction="toggle"`, `aria-haspopup="listbox"`, `aria-expanded`, and `data-open`.
- `Content(options)` renders `role="listbox"` with native `popover`, optional label, orientation, optional active descendant, `data-open`, and `ontoggle`.
- `Option(options)` renders `role="option"` with selected/disabled/active state. Enabled clicks select the value and close the popup.
- `move(state, items, direction)` updates `activeId` only.

## Boundaries

This slice does not implement hidden form inputs, typeahead, multi-select, or Combobox. It is the public Select shell that later form integration can extend.
