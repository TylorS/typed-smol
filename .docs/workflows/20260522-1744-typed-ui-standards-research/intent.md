# Intent - Typed UI Standards Research

Research the durable 2026 standards baseline for building a Typed-native, Ariakit-like `@typed/ui` component system.

The goal is not to clone Ariakit mechanically. The goal is to identify which platform capabilities, accessibility contracts, and Ariakit design ideas should shape `@typed/ui` so the implementation leans on lasting browser primitives where they exist and fills gaps only where standards still require author code.

Primary output:

- A source-backed research artifact that can feed the next requirements/specification pass.
- Concrete guidance for the next `@typed/ui` layer: collection/composite substrate, tabs, radio group, toolbar, menu, select/listbox, and combobox.
- Clear boundaries around native popover/dialog behavior, schema-backed data attributes, startup refs, and `RefSubject` state.

Non-goals:

- No implementation in this pass.
- No dependency changes.
- No broad rewrite of the RealWorld example branch.
- No custom overlay/focus-trap fallback recommendation when native platform semantics are available.
