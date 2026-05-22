# Specification - Typed Native Ariakit Port

## System Context and Scope

`@typed/ui` becomes the first-party accessible component layer for Typed. It expands from router/template integration helpers into a headless component toolkit with Ariakit-like naming and capabilities.

The first implementation tranche covers the substrate plus a Disclosure, Dialog, and native-Popover vertical slice:

- RefSubject state substrate: explicit `RefSubject` state refs, provider helpers, focused computed reads/selectors, updates, and event-time reads.
- Public state attributes: Schema-backed helpers for public `data-*` styling/inspection state.
- Startup hydration: ref-based helpers that initialize backing `RefSubject`s from server-rendered DOM state.
- Disclosure: APG disclosure behavior.
- Dialog: APG modal dialog behavior.
- Popover: native HTML Popover API only.

Out of scope for this tranche:

- Custom Popover overlay mechanics.
- Custom Popover focus trapping.
- First-party CSS.
- Composite-heavy widgets such as Menu, Select, Combobox, Tabs, Toolbar, and Radio.
- Framework or virtual-module changes.

## Component Responsibilities and Interfaces

### RefSubject State Model

`@typed/ui` maps Ariakit-like store capabilities onto `RefSubject` instead of introducing a separate store abstraction.

Conceptual responsibilities:

- Create explicit `RefSubject` values, for example `yield* RefSubject.make({ open: false })`.
- Pass `RefSubject` values directly to components as the state object.
- Treat externally provided refs as controlled state.
- Use `RefSubject.update`, `RefSubject.set`, and event handlers for state transitions.
- Support event-time state reads by yielding the ref.
- Support focused reactive reads/selectors through `RefSubject.map` and related computed refs.
- Provide optional Effect Context/Layer or `RefSubject.Service` helpers for nested component ergonomics.

Conceptual interface:

```ts
const disclosure = yield* RefSubject.make({ open: false });

const view = Disclosure({
  state: disclosure,
  content: DisclosureContent({ state: disclosure, content: "Details" }),
});
```

Provider-style usage remains available:

```ts
DisclosureProvider({ state: disclosure, content: DisclosureContent({ content: "Details" }) });
```

The exact function names may change during planning, but the public names should remain similar to Ariakit where practical.

### Public Data Attributes

`@typed/ui` exposes helpers for Schema-backed public `.data={object}` values that render as `data-*` attributes.

Responsibilities:

- Define a data object schema as string keys mapped to value schemas.
- Encode typed public state objects into plain string-valued `.data` objects accepted by the existing template object-to-`data-*` renderer.
- Decode public DOM `data-*` values back into typed `.data` objects for tests, inspection, and startup.
- Treat data schemas as whole-object contracts, not per-attribute descriptor objects, so they compose the same way template `.data={object}` does.
- Keep `data-*` limited to public styling/inspection state.
- Avoid using public `data-*` as internal hydration payloads.
- Compose naturally with the existing template `.data={object}` / object-to-`data-*` rendering shape.

Conceptual examples:

```ts
const DisclosureData = DataAttr.schema({
  open: Schema.Boolean,
  placement: Schema.Literal("top", "right", "bottom", "left"),
});

const data = yield* DataAttr.encode(DisclosureData, { open: true, placement: "bottom" });
// data is { open: "true", placement: "bottom" }
```

Rendered state should be stable enough for styling:

```html
<button data-open="true" aria-expanded="true">Toggle</button>
```

### Ref Startup Hydration

Components that need server-emitted startup state use a shared ref startup abstraction.

Responsibilities:

- Attach a DOM ref to a rendered element.
- Decode one or more public DOM state attributes through Schema-backed helpers.
- Initialize a backing `RefSubject` from an object decoded from the DOM.
- Avoid per-component ad hoc DOM parsing.
- Compose multiple data attrs easily so components can hydrate compound public state from `.data={object}` output.

Conceptual shape:

```ts
const state = yield* RefSubject.make({ open: false, placement: "bottom" as const });
const ref = hydrateRefFromData(state, DisclosureData);
```

### Disclosure

Disclosure owns or receives a `RefSubject` with `open` state and renders a control plus controlled content.

Responsibilities:

- Toggle open state from Enter, Space, and activation/click.
- Emit `aria-expanded`.
- Support `aria-controls` when content id is known.
- Emit stable public `data-open`.
- Compose with explicit `RefSubject` state and optional provider lookup.

### Dialog

Dialog owns modal dialog behavior.

Responsibilities:

- Render dialog semantics with `role="dialog"` and label support.
- Mark modal dialogs with `aria-modal="true"` only when behavior is actually modal.
- Move initial focus according to configured policy.
- Close on Escape when enabled.
- Support visible close controls in tab sequence.
- Return focus to the invoking element when closed when that element still exists.
- Emit stable public `data-open` and related public state.

### Popover

Popover owns non-modal native popover behavior only.

Responsibilities:

- Render native `popover` attribute values: `auto`, `hint`, or `manual`.
- Prefer declarative native relationships through `popovertarget` and `popovertargetaction`.
- Mirror native state through refs/startup reads and native `beforetoggle`/`toggle` events.
- Expose helper methods that call native `showPopover`, `hidePopover`, and `togglePopover` only when imperative control is needed.
- Fail clearly or mark unsupported when native Popover API is absent; do not polyfill with custom overlay behavior.

## System Diagrams (Mermaid)

```mermaid
flowchart TD
  App["Typed app code"] --> UI["@typed/ui"]
  UI --> State["RefSubject state model"]
  UI --> DataAttr["Schema data-* helpers"]
  UI --> Startup["Ref startup hydration"]
  UI --> Components["Disclosure / Dialog / Popover"]

  State --> RefSubject["@typed/fx RefSubject"]
  State --> Context["Effect Context/Layer or RefSubject.Service providers"]
  Components --> Template["@typed/template html/EventHandler"]
  Components --> DataAttr
  Components --> Startup
  Startup --> DOM["Server-rendered DOM"]
  Startup --> RefSubject
  Popover["Popover component"] --> NativePopover["Native HTML Popover API"]
```

```mermaid
sequenceDiagram
  participant Server as SSR render
  participant DOM as Server DOM
  participant Ref as Component ref
  participant Schema as DataAttr Schema
  participant State as RefSubject

  Server->>DOM: emit public .data object as data-open/data-* attrs
  DOM->>Ref: element attached on startup
  Ref->>Schema: decode public data-* object
  Schema->>State: initialize backing RefSubject object
  State->>DOM: future updates render through template
```

## Data and Control Flow

1. A component either receives an explicit `RefSubject` state value or reads a provider-backed ref from Effect Context.
2. Ref construction creates the backing state and computed selectors.
3. Rendering maps `RefSubject` state to ARIA attributes, public `data-*` attributes, and event handlers.
4. Schema-backed data helpers encode public state to string attributes.
5. On startup/hydration, refs can decode server-emitted DOM state and initialize backing `RefSubject`s.
6. Disclosure and Dialog own their state transitions through `RefSubject` updates and event handlers.
7. Popover delegates visibility mechanics to native Popover API and synchronizes `RefSubject` state from native events.

## Failure Modes and Mitigations

| failure | mitigation |
| ------- | ---------- |
| Popover silently behaves as custom overlay | Require native API only and test absence of custom visibility/focus trap layer. |
| `data-*` becomes internal hydration channel | Limit helpers to public styling/inspection state and route startup through ref helpers. |
| Schema decoding accepts invalid public state | Use Schema decode failures in tests and expose typed failure paths. |
| Dialog marks `aria-modal` without true modal behavior | Acceptance tests must cover modal behavior before `aria-modal="true"` is emitted. |
| State APIs drift into React-like hook assumptions | Model state as explicit `RefSubject` values, with providers as Context/Layer or `RefSubject.Service` helpers. |
| Focus behavior differs between DOM implementations and browsers | Browser-level checks are required for Dialog and native Popover behavior. |

## Requirement Traceability

| requirement_id | design_element | notes |
| -------------- | -------------- | ----- |
| FR-1, NFR-5 | `@typed/ui` package scope | No new package or framework changes. |
| FR-2 | API naming policy | Ariakit-similar names where practical. |
| FR-3, FR-4 | tranche scope | Substrate plus Disclosure/Dialog/Popover. |
| FR-5, FR-6, FR-7 | RefSubject state model | Explicit refs plus Effect provider helpers. |
| FR-8, FR-9, FR-10, FR-20 | DataAttr helpers | Public state only, whole-object Schema-backed encode/decode. |
| FR-11, NFR-7 | ref startup hydration | Shared ref path initializes `RefSubject`s from DOM. |
| FR-12 | Disclosure | APG disclosure behavior. |
| FR-13, NFR-1, NFR-3 | Dialog | APG modal dialog behavior and browser verification. |
| FR-14, FR-15, FR-16, FR-17, FR-18, NFR-6 | Popover | Native Popover API only, non-modal. |
| FR-19 | headless styling | Stable public `data-*`, no CSS. |
| NFR-2 | test strategy | Property/state-machine tests for RefSubject-backed state and data attrs. |
| NFR-4 | implementation style | Small composable Effect-native APIs. |

## References Consulted

- specs:
  - `.docs/specs/typed-framework-starter/spec.md`
  - `.docs/specs/router-virtual-module-plugin/spec.md`
  - `.docs/specs/httpapi-virtual-module-plugin/spec.md`
- adrs:
  - `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
- workflows:
  - `.docs/workflows/20260521-2247-typed-native-ariakit-port/intent.md`
  - `.docs/workflows/20260521-2247-typed-native-ariakit-port/scope.md`
  - `.docs/workflows/20260521-2247-typed-native-ariakit-port/02-research.md`
  - `.docs/workflows/20260521-2247-typed-native-ariakit-port/requirements.md`
- external:
  - Ariakit Component Stores
  - Ariakit `useDialogStore`
  - WAI-ARIA APG Disclosure Pattern
  - WAI-ARIA APG Dialog Modal Pattern
  - MDN Popover API
  - WHATWG HTML Popover
  - MDN `HTMLElement.dataset`

## ADR Links

- `.docs/workflows/20260521-2247-typed-native-ariakit-port/03-adr-native-popover-only.md`
