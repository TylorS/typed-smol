# Requirements - Typed Native Ariakit Port

## Functional Requirements

- FR-1: `@typed/ui` shall be the home for the Ariakit-like accessible component system.
- FR-2: Public component and store names shall stay similar to Ariakit where practical, adapted only when Typed's Effect/template model requires different naming.
- FR-3: The first implementation sequence shall be substrate first, minimal usable kit second, and composite-heavy proof third.
- FR-4: The first substrate milestone shall include a concrete Disclosure, Dialog, and Popover vertical slice.
- FR-5: Stores shall be explicit values that can be passed to components.
- FR-6: Stores shall support provider helpers backed by Effect Context/Layer so nested components can discover the current store ergonomically.
- FR-7: Stores shall support default state, controlled state, setter callbacks, direct event-time reads, and focused reactive reads/selectors.
- FR-8: Public `data-*` state attributes shall be generated from typed values through Effect Schema-backed encoding helpers.
- FR-9: Public `data-*` state attributes shall be decodable through Effect Schema-backed helpers for inspection, tests, and startup reads.
- FR-10: `data-*` attributes shall represent public styling/inspection state only, not internal hydration payloads.
- FR-11: Components that need server-emitted startup state shall use ref-based startup helpers to initialize backing `RefSubject`s from DOM state.
- FR-12: Disclosure shall satisfy the APG disclosure behavior: a button controls content visibility, Enter/Space toggles it, `aria-expanded` reflects state, and `aria-controls` is supported when content has an id.
- FR-13: Dialog shall satisfy the APG modal dialog behavior when configured as modal: role/label semantics, modal behavior, initial focus handling, close affordance support, Escape close behavior, and focus return.
- FR-14: Popover shall use only the native HTML Popover API.
- FR-15: Popover shall be non-modal in v1; modal/focus-trapping behavior belongs to Dialog.
- FR-16: Popover shall prefer native declarative relationships through `popover`, `popovertarget`, and `popovertargetaction` where possible.
- FR-17: Popover store state shall mirror native DOM popover state through refs/startup reads and native toggle events rather than replacing native visibility semantics.
- FR-18: Popover shall not implement custom overlay mechanics, custom popover focus trapping, or a JS-only visibility layer.
- FR-19: Components shall be headless and emit stable `data-*` state attributes; no first-party CSS is included in the initial scope.

## Non-Functional Requirements

- NFR-1: Accessibility behavior shall be grounded in WAI-ARIA/APG and native platform behavior before local convenience behavior.
- NFR-2: The implementation shall favor property tests and state-machine tests for store behavior where practical.
- NFR-3: Browser-sensitive behavior, especially focus and native Popover behavior, shall have browser-level verification where unit tests are insufficient.
- NFR-4: Public APIs shall keep functions small and composable, matching existing Typed functional and Effect-native style.
- NFR-5: The first slice shall avoid broad framework changes, virtual-module changes, or package-splitting.
- NFR-6: Unsupported native Popover API environments shall not silently fall back to a custom popover implementation.
- NFR-7: SSR and hydration behavior shall avoid per-component ad hoc DOM parsing.

## Acceptance Criteria

- AC-1: A first implementation plan can trace every substrate, Disclosure, Dialog, and Popover task back to one or more FR/NFR ids. Maps to FR-3, FR-4, NFR-4.
- AC-2: Store tests prove default, controlled, setter, event-read, selector-read, explicit store passing, and provider lookup behavior. Maps to FR-5, FR-6, FR-7, NFR-2.
- AC-3: Schema-backed `data-*` tests prove encode/decode for booleans, string literal unions, optional values, and rejected invalid values. Maps to FR-8, FR-9, FR-10, NFR-2.
- AC-4: Ref startup tests prove a backing `RefSubject` can initialize from server-rendered DOM state without each component hand-parsing DOM attributes. Maps to FR-11, NFR-7.
- AC-5: Disclosure tests prove keyboard toggle, `aria-expanded`, optional `aria-controls`, and stable public `data-*` output. Maps to FR-8, FR-12, FR-19.
- AC-6: Dialog tests prove role/label semantics, initial focus, close affordance compatibility, Escape close, focus return, modal behavior, and stable public `data-*` output. Maps to FR-8, FR-13, FR-19, NFR-1, NFR-3.
- AC-7: Popover tests prove native `popover` attribute output, native invoker relationship support, native toggle event synchronization, non-modal scope, and no custom visibility/focus-trap layer. Maps to FR-14, FR-15, FR-16, FR-17, FR-18, NFR-3, NFR-6.
- AC-8: Documentation states that Popover v1 requires native Popover API support and does not polyfill with custom overlay behavior. Maps to FR-14, FR-18, NFR-6.

## Prioritization

- must_have:
  - FR-1 through FR-19
  - NFR-1 through NFR-7
  - AC-1 through AC-8
- should_have:
  - Browser-level screenshot or interaction evidence for Dialog and Popover.
- could_have:
  - Additional examples comparing Ariakit naming to Typed equivalents after the first implementation slice exists.

## Source Trace

- Ariakit Component Stores: store default/controlled/setter/read/write/provider behavior.
- Ariakit `useDialogStore`: dialog/disclosure store relationship and open/defaultOpen shape.
- WAI-ARIA APG Disclosure Pattern: disclosure keyboard and ARIA behavior.
- WAI-ARIA APG Dialog Modal Pattern: dialog focus and ARIA behavior.
- MDN Popover API and WHATWG HTML Popover: native popover-only, non-modal, declarative invoker, and toggle behavior.
- MDN `HTMLElement.dataset`: string-backed `dataset` behavior motivating Schema-backed encode/decode helpers.
- Local `packages/template/src/Render.ts`: existing object-to-`data-*` renderer behavior.
- Local `packages/template/src/Hydration.test.ts`: existing hydrated reactive `data-*` behavior.
