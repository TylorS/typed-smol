## Research Questions

1. What Ariakit store/provider capabilities should Typed preserve for the first `@typed/ui` component system milestone?
2. What APG/WAI-ARIA behavior is mandatory for the first vertical slice: Disclosure, Dialog, and Popover?
3. What local Typed primitives already support stores, `data-*`, SSR, hydration, and DOM startup behavior?
4. What should requirements say about Schema-backed public `data-*` attributes and ref-based `RefSubject` startup hydration?

## Source Table

| source                                                                                            | year              | type              | confidence | notes                                                                                                                                   |
| ------------------------------------------------------------------------------------------------- | ----------------- | ----------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Ariakit Component Stores, `https://ariakit.com/guide/component-stores`                            | 2026 current docs | official docs     | high       | Stores expose default, controlled, setter, read, and write semantics; providers usually supply stores automatically.                    |
| Ariakit `useDialogStore`, `https://ariakit.com/reference/use-dialog-store`                        | 2026 current docs | official docs     | high       | Dialog store extends disclosure concepts, supports open/defaultOpen and disclosure-store synchronization.                               |
| WAI-ARIA APG Dialog Modal Pattern, `https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/`       | current APG       | W3C official docs | high       | Defines modal dialog roles, focus entry/return expectations, close affordance, and modal behavior constraints.                          |
| WAI-ARIA APG Disclosure Pattern, `https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/`           | current APG       | W3C official docs | high       | Defines disclosure as button + controlled content with Enter/Space toggle and `aria-expanded`.                                          |
| MDN `HTMLElement.dataset`, `https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset` | updated 2025      | MDN reference     | high       | `dataset` values are string-backed and name-converted, supporting the need for explicit Schema encode/decode.                           |
| MDN Popover API, `https://developer.mozilla.org/en-US/docs/Web/API/Popover_API`                   | Baseline 2025     | MDN reference     | high       | Native popovers are non-modal, support declarative and JS control, and expose `auto`, `hint`, and `manual` states.                      |
| MDN Using the Popover API, `https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using`   | current docs      | MDN guide         | high       | `popovertarget` creates invoker relationships with focus-order and implicit ARIA benefits; `auto` supports light dismiss and Esc close. |
| WHATWG HTML Popover section, `https://html.spec.whatwg.org/multipage/popover.html`                | living standard   | standard          | high       | Defines show/hide algorithms, toggle events, focus restoration, and validity checks.                                                    |
| `packages/template/src/Render.ts`                                                                 | current repo      | local code        | high       | Existing renderer already converts sync object interpolation into `data-*` attributes.                                                  |
| `packages/template/src/Hydration.test.ts`                                                         | current repo      | local tests       | high       | Existing hydration tests cover static, primitive, Effect, and Fx `data-*` attributes.                                                   |
| `examples/todomvc/src/domain.ts`                                                                  | current repo      | local code        | high       | Existing app code uses Effect Schema for branded and encoded domain values.                                                             |

## WebSearch Query Log

| query                                                                                                            | rationale                                               | selected_sources                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `Ariakit v0.4.26 components stores providers official docs DialogStore PopoverStore DisclosureStore`             | verify current Ariakit store/provider model             | Ariakit Component Stores; Ariakit `useDialogStore`                                                                                              |
| `WAI ARIA Authoring Practices Guide Dialog Modal Disclosure Popover pattern keyboard interaction`                | source first-slice accessibility behavior               | WAI-ARIA APG Dialog Modal Pattern; WAI-ARIA APG Disclosure Pattern                                                                              |
| `WAI ARIA APG Disclosure Dialog Popover Menu Button keyboard interaction 2025`                                   | confirm newer APG pages and related patterns            | WAI-ARIA APG pattern pages                                                                                                                      |
| `accessible UI component library research keyboard navigation focus management WAI ARIA composite widgets paper` | paper discovery for broader accessibility evidence      | found older keyboard navigation paper; not yet selected as core evidence because official APG is more directly normative for first requirements |
| `MDN Popover API HTMLElement showPopover hidePopover togglePopover browser support 2026`                         | verify current native Popover API maturity and behavior | MDN Popover API; MDN popover property; web.dev baseline note                                                                                    |
| `WHATWG HTML popover attribute showPopover hidePopover togglePopover`                                            | verify normative native popover semantics               | WHATWG HTML Popover section                                                                                                                     |

## Key Findings

- Ariakit's store model is central, not incidental. Stores initialize state, allow controlled state, expose setter callbacks, provide direct state reads in events, and connect separated component parts through a `store` prop.
- Ariakit providers are ergonomic wrappers around stores. Typed should preserve this capability through explicit stores plus Effect service/provider helpers, matching the approved hybrid direction.
- Disclosure has a small APG contract: a button controls content visibility, Enter/Space toggle it, `aria-expanded` reflects state, and `aria-controls` can point at the controlled content.
- Dialog has a stricter APG contract: role `dialog`, `aria-modal` only when behavior is truly modal, initial focus management, focus return on close, and a visible close button in the tab sequence.
- Popover v1 should be native API backed only. This changes the requirement from "custom floating overlay with Ariakit-like behavior" to "Typed wrapper around `popover`, `popovertarget`, `popovertargetaction`, toggle events, and `showPopover`/`hidePopover`/`togglePopover` where needed."
- Native Popover API popovers are non-modal. Modal behavior should remain owned by Dialog.
- Prefer declarative invoker relationships with `popovertarget` when possible because the browser adds useful focus-order and implicit assistive-technology relationships.
- Popover store state should mirror native popover state through DOM/ref startup and toggle events rather than being the only source of truth for display.
- DOM `dataset` is string-backed. Schema-backed encoding/decoding is required if `@typed/ui` exposes typed public state through `data-*`.
- Typed's template renderer already has object-to-`data-*` behavior, but that behavior is generic and not yet a component-system contract.
- Typed's hydration tests already demonstrate that `data-*` attributes survive and update through hydration.
- Ref-based startup hydration should initialize backing `RefSubject`s from server-emitted DOM state instead of parsing hidden internal payloads through public `data-*`.

## Open Risks and Unknowns

- Native Popover API support is Baseline 2025, but older browsers/devices may not support it. Requirements must choose whether unsupported environments fail clearly, no-op, or are out of support.
- Native API constraints may limit Ariakit-style custom behavior. `@typed/ui` should not paper over those constraints with custom overlay logic in Popover v1.
- Schema-backed `data-*` APIs must avoid implying that every internal store field is public styling state.
- Ref startup hydration must be centralized enough to avoid per-component DOM parsing, but small enough not to become a generic app hydration framework.
- Focus management may require browser-level tests, not only unit tests.

## Implications for Requirements and Specification

- Requirements should define `@typed/ui` stores as explicit values with default, controlled, setter, selector/read, and event-read behavior.
- Requirements should require provider helpers that expose stores through Effect Context/Layer while preserving explicit store passing.
- Requirements should require public `data-*` state helpers that encode/decode with Effect Schema and document string conversion behavior.
- Requirements should require a ref startup helper that can initialize a `RefSubject` from a DOM element through Schema decoding.
- Requirements should treat Disclosure and Dialog APG behavior as acceptance-testable.
- Requirements should specify Popover as a native-popover-only, non-modal component. Dialog owns modal behavior.
- Requirements should specify the desired unsupported-browser behavior for native Popover API absence.

## Alignment Notes

- specs_alignment:
  - Aligns with `.docs/specs/typed-framework-starter/spec.md` by keeping implementation in explicit Typed packages and avoiding hidden framework ownership.
- adrs_alignment:
  - Aligns with `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`; this component effort does not introduce filesystem routing or hidden generated app ownership.
- workflows_alignment:
  - Continues approved decisions in `intent.md` and `scope.md`: `@typed/ui` home, Ariakit-similar naming, hybrid stores/providers, substrate-first sequence, public Schema-backed `data-*`, and ref-based `RefSubject` startup hydration.

## Memory Promotion Candidates

- heuristic, medium confidence: For `@typed/ui` accessible components, public `data-*` attributes are styling/inspection state only; backing `RefSubject`s should initialize from DOM through refs and Schema decoding where SSR state matters.
- heuristic, medium confidence: Treat Ariakit store/provider parity as a capability target, but map React hooks/providers to explicit stores plus Effect Context/Layer provider helpers.
