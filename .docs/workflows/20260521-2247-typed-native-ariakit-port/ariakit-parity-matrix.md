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
| Render props / `as` composition | remaining | `Dom.ElementOptions` exists, but most primitives still need full host-element composition. |
| Data attrs | implemented | `DataAttr.schema` and `.data={object}` encode public state. |
| Startup hydration | implemented | `StartupRef.fromData` composes multiple schema-backed DOM data hydrators. |
| Collection registration | implemented | `Collection.register` unregisters on Scope close. |
| Composite keyboard movement | implemented | Menu, Listbox, Select, Menubar, RadioGroup, Tabs, and Toolbar expose keyboard movement via `items`. |
| Typeahead | typed-native | `Composite.typeahead` exists; component-level wiring remains incremental. |
| Browser overlay proof | implemented | `test:browser` verifies baseline native popover and dialog support. |

## Components

| Ariakit family | Status | Notes |
| --- | --- | --- |
| Button / Command | implemented | Native button semantics. |
| Checkbox | implemented | RefSubject-backed checked state and data attrs. |
| Combobox | implemented | Input/listbox linkage, native popover content, active item movement, Enter select, Escape close. Filtering/autocomplete policy remains future work. |
| Composite | implemented | Movement, roving tabindex, virtual active descendant, keyboard mapping, and typeahead helper. |
| Dialog | implemented | Native `<dialog>`, trigger/close, open sync, focus return to invoker. More focus policy options remain. |
| Disclosure | implemented | Button/content APG attributes with public data state. |
| FocusTrap | remaining | Exported placeholder; native `<dialog>` owns modal focus by default. |
| Form | typed-native | Typed state and keyed field names; array push/remove and schema codecs remain. |
| Hovercard | implemented | Native popover content, anchor open/close lifecycle, disclosure/dismiss parts. |
| Listbox | implemented | Single-select options, active movement, selected data attrs, virtual focus relationship. |
| Menu / Menubar | implemented | Native popover menu, checkbox/radio items, APG roles, keyboard movement. Nested submenu policy remains. |
| Popover | implemented | Native popover trigger/content/dismiss, initial-open hydration, toggle sync, static CSS anchor-positioning attributes. |
| RadioGroup | implemented | Radio roles, checked state, toolbar-aware movement, keyboard selection. |
| Select | implemented | Native popover listbox, option selection, active movement, selected data attrs. Hidden input/form integration remains. |
| Separator / Group / Heading / VisuallyHidden / Role / Focusable | implemented | Structural primitives and common subparts exist. |
| Tabs | implemented | Tablist/tab/panel relationships, automatic keyboard activation, manual selection helper. |
| Toolbar | implemented | Toolbar role, item roving tabindex, keyboard movement. |
| Tooltip | implemented | Native hint popover and focus/hover lifecycle. Delay/grace policy remains. |

## Remaining Explicit Gaps

- Full host element replacement and event/ref merge for every primitive.
- Renderable CSS anchor-positioning options; this slice exposes static `anchorName`, `positionAnchor`, and `positionArea`.
- Component-level typeahead wiring beyond the shared `Composite.typeahead` helper.
- Combobox filtering/autocomplete modes and async `Fx`/`Stream` item sources.
- Nested menu/submenu open-delay coordination.
- Select hidden input and full form participation.
- Real `FocusTrap` semantics or explicit deprecation in favor of native dialog.
- Form schema codecs, validation lifecycle, and real `Push`/`Remove` array semantics.
- Browser coverage for component-rendered popover/dialog/focus flows beyond the native baseline smoke.
