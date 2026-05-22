# Intent - Typed UI Listbox Layer

Add `Listbox` as the next `@typed/ui` primitive after `Menu`.

Listbox should be the reusable single-selection surface that later `Select` can wrap. It should keep the established Typed UI rules:

- direct `RefSubject.RefSubject<Listbox.State>`;
- APG `listbox` / `option` roles;
- composite active item movement;
- selected value state;
- public `data-selected`, `data-active`, and `data-disabled`;
- `Opts extends Options` component APIs for renderable inference;
- no store abstraction.
