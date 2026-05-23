# Intent - Typed Native Ariakit Port

## Current Intent Draft

Design a Typed-native component toolkit inspired by Ariakit's capabilities, not a React wrapper and not a direct copy of Ariakit internals.

The target should preserve the capabilities that make Ariakit valuable:

- accessible component families grounded in WAI-ARIA patterns
- composable state stores for controlled and uncontrolled widgets
- provider/context-style composition adapted to Typed and Effect
- abstract primitives for role, focus, collection, composite navigation, group, command, and separators
- concrete widgets such as Button, Checkbox, Combobox, Dialog, Disclosure, Form, Heading, Hovercard, Menu, Menubar, Popover, Radio, Select, Tab, Toolbar, Tooltip, and VisuallyHidden
- advanced composition between widgets, such as Dialog + Combobox command menus, Select + Combobox, Menu + Combobox, and tabbed command palettes

## Typed-Native Interpretation

"Typed-native" currently means:

- Built on `@typed/template`, `@typed/fx`, `@typed/router`, and `@typed/ui` patterns.
- Uses Effect services, Layers, Fx, EventHandler, RefSubject, and typed renderable values directly.
- Produces templates and browser behavior without depending on React.
- Keeps framework-level additions aligned with Typed's virtual-module-first architecture.
- Treats accessibility behavior as behavior and state contracts, not only DOM markup helpers.

## What Beginning Means

This workflow begins with intent and scope, then proceeds through strict staged artifacts before implementation:

1. Confirm intent and boundaries.
2. Research Ariakit, WAI-ARIA/APG, and the existing Typed UI/rendering substrate.
3. Define requirements and acceptance criteria.
4. Specify architecture and API shape.
5. Plan incremental milestones.
6. Execute task-by-task with failing tests first.
7. Finalize through a PR.

## Known Human Decisions

- mode: strict
- finalization strategy: pr
- package boundary: this work is the purpose of `@typed/ui`; do not create a separate first-party component package for it.
- naming direction: keep public API names similar to Ariakit where practical, adapted only where Typed idioms require it.
- store/provider direction: hybrid; stores should be explicit values for testability/composition and also installable through Effect Context/Layer provider helpers for nested component ergonomics.
- first vertical slice: attach Disclosure, Dialog, and Popover to the abstract substrate milestone.
- styling boundary: headless components with stable `data-*` state attributes; no first-party CSS in the initial scope.
- data attribute boundary: make Schema-backed encoding/decoding of public `data-*` attributes easy, so styling/inspection state attrs are typed and validated rather than ad hoc strings.
- hydration boundary: include a ref-based startup abstraction that initializes backing `RefSubject`s from DOM state emitted by the server.
- popover boundary: `@typed/ui` Popover should use only the native HTML Popover API; it should not implement a custom overlay/popover mechanism.

## Open Intent Questions

- Whether long-term Ariakit-like capability parity should mean every Ariakit component family, or only the capability classes needed by Typed applications.
