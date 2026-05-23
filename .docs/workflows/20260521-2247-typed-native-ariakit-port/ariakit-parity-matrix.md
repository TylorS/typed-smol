# Ariakit Parity Matrix

Status legend:

- `implemented`: public Typed-native primitive exists with behavior coverage.
- `typed-native`: Ariakit capability exists through `RefSubject`, `Renderable`, `Schema`, Scope, or native platform APIs instead of React-specific hooks/stores.
- `intentional-divergence`: not a target for `@typed/ui`.
- `remaining`: known parity gap.

## Cross-Cutting

| Area | Status | Notes |
| --- | --- | --- |
| React stores/hooks | typed-native | Mapped to public `RefSubject` state and `RefSubject.Service` provider keys. |
| Portal / PortalContext | intentional-divergence | Native popover/dialog are the overlay baseline; portals are not a parity target. |
| Render props / `as` composition | typed-native | `Dom.HostOptions<Element>` is the preferred replacement path. Button, Dialog, Popover, and Select now pass internal props/content to caller-owned hosts; wider primitive rollout remains incremental. |
| Data attrs | implemented | `DataAttr.schema` and `.data={object}` encode public state. |
| Startup hydration | implemented | `StartupRef.fromData` composes multiple schema-backed DOM data hydrators. |
| Collection registration | implemented | `Collection.register` unregisters on Scope close. |
| Composite keyboard movement | implemented | Menu, Listbox, Select, Menubar, RadioGroup, Tabs, and Toolbar expose keyboard movement via `items`. |
| Typeahead | typed-native | `Composite.typeahead`, buffered helpers, and Select content wiring exist; broader component wiring remains incremental. |
| Browser overlay proof | implemented | `test:browser` verifies baseline platform support plus rendered Popover, Dialog, Combobox, and Select form flows. |

## Components

| Ariakit family | Status | Notes |
| --- | --- | --- |
| Button / Command | implemented | Native button semantics. |
| Checkbox | implemented | RefSubject-backed checked state and data attrs. |
| Combobox | implemented | Input/listbox linkage, native popover content, active item movement, Enter select, Escape close. Filtering/autocomplete policy remains future work. |
| Composite | implemented | Movement, roving tabindex, virtual active descendant, keyboard mapping, and typeahead helper. |
| Dialog | implemented | Native `<dialog>`, trigger/close, open sync, and invoker focus restoration path. More focus policy options remain. |
| Disclosure | implemented | Button/content APG attributes with public data state. |
| FocusTrap | intentional-divergence | Deprecated in favor of native `<dialog>` for modal focus. |
| Form | typed-native | Typed state, keyed field names, schema validation, reset defaults, and array-only `Push`/`Remove`. Rich field metadata/codecs remain incremental. |
| Hovercard | implemented | Native popover content, anchor open/close lifecycle, disclosure/dismiss parts. |
| Listbox | implemented | Single-select options, active movement, selected data attrs, virtual focus relationship. |
| Menu / Menubar | implemented | Native popover menu, checkbox/radio items, APG roles, keyboard movement. Nested submenu policy remains. |
| Popover | implemented | Native popover trigger/content/dismiss, initial-open hydration, toggle sync, and renderable CSS anchor-positioning attributes. |
| RadioGroup | implemented | Radio roles, checked state, toolbar-aware movement, keyboard selection. |
| Select | implemented | Native popover listbox, option selection, active movement, typeahead, selected data attrs, and hidden input form participation. |
| Separator / Group / Heading / VisuallyHidden / Role / Focusable | implemented | Structural primitives and common subparts exist. |
| Tabs | implemented | Tablist/tab/panel relationships, automatic keyboard activation, manual selection helper. |
| Toolbar | implemented | Toolbar role, item roving tabindex, keyboard movement. |
| Tooltip | implemented | Native hint popover and focus/hover lifecycle. Delay/grace policy remains. |

## Remaining Explicit Gaps

- Full host element replacement rollout beyond Button/Dialog/Popover/Select and event/ref merge adoption at every primitive boundary.
- Component-level typeahead wiring beyond Select and the shared `Composite.typeahead` helpers.
- Combobox filtering/autocomplete modes and async `Fx`/`Stream` item sources.
- Nested menu/submenu open-delay coordination.
- Full Select form-controller integration beyond hidden input submission.
- Rich Form field metadata/codecs and submit/reset lifecycle hooks beyond current schema validation/default reset.
