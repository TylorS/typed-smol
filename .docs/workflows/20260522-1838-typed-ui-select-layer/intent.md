# Intent - Typed UI Select Layer

Add `Select` as the first value-picking wrapper over native Popover and Listbox semantics.

The slice should prove:

- direct `RefSubject.RefSubject<Select.State<Value>>`;
- native Popover trigger/content relationship;
- APG `listbox` / `option` popup semantics;
- selected value and active option state;
- option click selects and closes the popup;
- public `data-open`, `data-selected`, `data-active`, and `data-disabled`;
- `Opts extends Options` component APIs.
