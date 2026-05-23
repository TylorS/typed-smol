# Ariakit Parity Matrix

Status legend:

- `implemented`: public Typed-native primitive exists with behavior coverage.
- `typed-native`: Ariakit capability exists through `RefSubject`, `Renderable`, `Schema`, Scope, or native platform APIs instead of React-specific hooks/stores.
- `intentional-divergence`: not a target for `@typed/ui`.
- `refinement`: public primitive exists, but an Ariakit-like behavior option or edge policy is still missing.
- `remaining`: known parity gap with no public Typed-native equivalent.

## Cross-Cutting

| Area | Status | Notes |
| --- | --- | --- |
| React stores/hooks | typed-native | Mapped to public `RefSubject` state and `RefSubject.Service` provider keys. |
| Native overlay root | intentional-divergence | Native popover/dialog are the overlay baseline; non-native overlay mounting APIs are not a target. |
| Render props / `as` composition | implemented | `Dom.HostOptions<Element>` is the preferred replacement path. Stateful primitives, overlay parts, composite parts, Form controls, and structural helpers pass internal props/content to caller-owned hosts through `Dom.mergeProps`. |
| Data attrs | implemented | `DataAttr.schema` and `.data={object}` encode public state. |
| Startup hydration | implemented | `StartupRef.fromData` composes multiple schema-backed DOM data hydrators. |
| Collection registration | implemented | `Collection.register` unregisters on Scope close. |
| Composite keyboard movement | implemented | Menu, Listbox, Select, Menubar, RadioGroup, Tabs, and Toolbar expose keyboard movement via `items`. |
| Typeahead | implemented | `Composite.typeahead`, buffered helpers, and component-level wiring exist across Menu, Menubar, Listbox, Select, Combobox, RadioGroup, Tabs, and Toolbar. |
| Browser overlay proof | implemented | `test:browser` verifies baseline platform support plus rendered Popover, Dialog, Combobox, and Select form flows. |

## Components

| Ariakit family | Status | Notes |
| --- | --- | --- |
| Button / Command | implemented | Native button semantics. |
| Checkbox | implemented | RefSubject-backed checked state and data attrs. |
| Combobox | implemented | Input/listbox linkage, native popover content, active item movement, Enter select, Escape close, typeahead, async/static item sources, filtering, autocomplete modes, and auto-select. |
| Composite | implemented | Movement, roving tabindex, virtual active descendant, keyboard mapping, and typeahead helper. |
| Dialog | refinement | Native `<dialog>`, trigger/close, open sync, and invoker focus restoration path. Initial/final focus policy and richer close-policy options remain as refinements. |
| Disclosure | implemented | Button/content APG attributes with public data state. |
| Modal focus shim | intentional-divergence | Removed in favor of native `<dialog>` for modal focus. |
| Form | implemented | Typed state, keyed field names, schema validation, field metadata, schema DOM value codecs, submit/reset lifecycle, and array-only `Push`/`Remove`. |
| Hovercard | implemented | Native popover content, anchor open/close lifecycle, disclosure/dismiss parts. |
| Listbox | implemented | Single-select options, active movement, selected data attrs, virtual focus relationship. |
| Menu / Menubar | implemented | Native popover menu, checkbox/radio items, APG roles, keyboard movement, typeahead, and native submenu trigger/content coordination with open/close delays. |
| Popover | implemented | Native popover trigger/content/dismiss, initial-open hydration, toggle sync, and renderable CSS anchor-positioning attributes. |
| RadioGroup | implemented | Radio roles, checked state, toolbar-aware movement, keyboard selection. |
| Select | implemented | Native popover listbox, option selection, active movement, typeahead, selected data attrs, hidden input submission, and optional Form state synchronization. |
| Separator / Group / Heading / VisuallyHidden / Role / Focusable | implemented | Structural primitives and common subparts exist. |
| Tabs | implemented | Tablist/tab/panel relationships, automatic keyboard activation, manual selection helper. |
| Toolbar | implemented | Toolbar role, item roving tabindex, keyboard movement. |
| Tooltip | refinement | Native hint popover and focus/hover lifecycle. Delay/grace policy remains as a refinement. |

## Remaining Explicit Gaps

- Host-first composition, typeahead wiring, Combobox filtering/autocomplete, nested submenu delay coordination, Select form-state sync, and Form metadata/codecs/lifecycle hooks are closed in the current gap pass.
- There are no known broad `remaining` component-family gaps in the current matrix.

## Known Refinements

- Dialog: expose typed options for initial focus, final focus, modal/non-modal behavior, and close policies beyond the current native baseline.
- Tooltip: expose typed open/close delay and hover/focus grace policies while preserving non-interactive tooltip semantics.
- Docs: older slice-specific workflow finalization notes still describe gaps that are now closed by later passes; use this matrix as the current parity source of truth.
