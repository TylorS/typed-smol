# Intent - Typed UI Menu Layer

Add `Menu` as the next `@typed/ui` component layer after `Collection`, `Composite`, `Popover`, `Tabs`, `RadioGroup`, and `Toolbar`.

The first menu slice should prove the lasting architecture:

- direct `RefSubject.RefSubject<Menu.State>`;
- native Popover attributes only;
- APG-style `menu` / `menuitem` roles;
- composite movement helpers for active item state;
- public `data-open`, `data-active`, and `data-disabled`;
- option APIs shaped as `function Name<const Opts extends NameOptions>(options: Opts)`;
- no custom positioning engine, overlay, or focus trap.
