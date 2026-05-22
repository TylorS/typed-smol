# Workflow Memory - Typed UI Standards Implementation

- `bcaf` started with only `HttpRouter` and `Link` in `packages/ui/src`; the implementation added the Ariakit-like substrate directly to this worktree.
- This branch's Effect Schema API uses `Schema.Union([Schema.Literal(...)])`; `Schema.Literals(...)` is not available here.
- Template boolean attributes support `?hidden=${...}` at runtime. When used beside spread props, preserve literal prop shape with `as const` so the template tag type checker accepts the reactive boolean value without a value cast.
- `Collection.byDomOrder` must not rely on global `Node` in tests; use DOM `compareDocumentPosition` bit values so happy-dom-created elements work without a global `Node`.
- `Collection.register` is scope-owned in `codex/typed-beta`; it registers a finalizer on the current `Scope` and callers should not manually retain cleanup effects.
- Component APIs should use `function Name<const Opts extends NameOptions>(options: Opts)` so non-content renderables like `id`, `label`, and `controls` preserve concrete error/service inference.
- Keep future Menu, Select/Listbox, and Combobox work separate. The current slice intentionally stops at Collection, Composite, Tabs, RadioGroup, and Toolbar.
