## Research Questions

1. Which 2026 web-platform features are stable enough to anchor long-lived `@typed/ui` primitives?
2. Which component behaviors should come from native HTML rather than custom JavaScript?
3. Which APG patterns should define the next Ariakit-like component layer after Link/HttpRouter?
4. Which Ariakit concepts should be preserved conceptually while adapting to Typed's `RefSubject`, Effect, and template model?
5. Which emerging features are useful to design for, but not safe as hard requirements yet?

## Source Table

| source                                                                                                                                                      | year                             | type                         | confidence  | notes                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| web.dev Baseline 2026, `https://web.dev/baseline/2026`                                                                                                      | 2026                             | official Baseline reference  | high        | Baseline 2026 currently includes Navigation API, Trusted Types, Reporting API, Active View Transition, and related platform features. |
| web.dev Baseline overview, `https://web.dev/baseline`                                                                                                       | 2026                             | official Baseline reference  | high        | Defines yearly Baseline targets; confirms Popover is Baseline 2025 and `inert` is Baseline 2023.                                      |
| web.dev Popover Baseline note, `https://web.dev/blog/popover-baseline`                                                                                      | 2025                             | official Baseline correction | high        | Popover entered Baseline Newly Available on 2025-01-27 after an iOS light-dismiss issue was fixed.                                    |
| MDN Popover API, `https://developer.mozilla.org/en-US/docs/Web/API/Popover_API`                                                                             | updated 2025                     | MDN reference                | high        | Popovers are non-modal; modal layered UI should use `<dialog>`.                                                                       |
| MDN Using the Popover API, `https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using`                                                             | updated 2025                     | MDN guide                    | high        | `popovertarget` creates focus-order and implicit ARIA relationships; `toggle`/`beforetoggle` expose native state changes.             |
| WHATWG HTML Popover, `https://html.spec.whatwg.org/multipage/popover.html`                                                                                  | living standard, 2026 snapshot   | standard                     | high        | Defines `auto`, `manual`, and `hint` popover states, light dismiss, and top-layer interactions.                                       |
| MDN `<dialog>` / `showModal`, `https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal`                                                | updated 2026                     | MDN reference                | high        | `showModal()` is Baseline widely available since 2022 and makes non-dialog document content inert.                                    |
| WHATWG Interactive Elements, `https://html.spec.whatwg.org/multipage/interactive-elements.html`                                                             | living standard, 2026 snapshot   | standard                     | high        | `details` represents a disclosure widget; dialog and command semantics are defined by the platform.                                   |
| MDN Invoker Commands API, `https://developer.mozilla.org/en-US/docs/Web/API/Invoker_Commands_API`                                                           | updated 2026                     | MDN reference                | medium-high | Baseline 2025; enables declarative button control for popovers/dialogs without waiting for JS.                                        |
| HTML developer edition button commands, `https://html.spec.whatwg.org/dev/form-elements.html`                                                               | living standard, 2026 snapshot   | standard                     | high        | `commandfor`/`command` examples cover popover show/hide/toggle and custom command events.                                             |
| MDN CSS Anchor Positioning, `https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Using`                                              | updated 2025                     | MDN guide                    | medium      | Useful for positioning popovers/menus/tooltips; should be progressive enhancement until compatibility target is explicit.             |
| W3C WCAG 2.2 new criteria, `https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/`                                                                    | W3C Recommendation 2023, current | W3C standard guidance        | high        | Adds focus-not-obscured, target size, dragging alternatives, and accessible authentication requirements.                              |
| WAI-ARIA APG Patterns, `https://www.w3.org/WAI/ARIA/apg/patterns/`                                                                                          | current 2026 pages               | W3C official guide           | high        | Component contracts for tabs, radio groups, toolbar, menu, listbox, combobox, tooltip, etc.                                           |
| WAI-ARIA APG composite focus practice, `https://wai-aria-practices.netlify.app/aria-practices/`                                                             | current APG practice             | W3C official guide mirror    | high        | Roving tabindex and `aria-activedescendant` are the two core focus-management strategies.                                             |
| Ariakit Component Stores, `https://ariakit.com/guide/component-stores`                                                                                      | current 2026 docs                | official library docs        | medium-high | Stores provide default/controlled state, setters, direct event reads, selectors, and provider integration.                            |
| Ariakit Composite, `https://ariakit.com/components/composite` and `https://ariakit.com/reference/composite`                                                 | current 2026 docs                | official library docs        | medium-high | Composite is the reusable substrate for arrow-key navigation and a single tab stop.                                                   |
| Ariakit Tabs/Menu/Select docs, `https://ariakit.com/components/tab`, `https://ariakit.com/reference/menu`, `https://ariakit.com/reference/use-select-store` | current 2026 docs                | official library docs        | medium-high | Confirms Ariakit's higher-level components layer on composite, collection, popover, focusable, command, and store concepts.           |
| Open UI home, `https://open-ui.org/`                                                                                                                        | current 2026                     | W3C Community Group          | medium      | Useful for future-facing component vocabulary and native control extensibility, but not all proposals are standards-ready.            |
| Local `packages/ui/src/Link.ts`                                                                                                                             | current `bcaf` branch            | repo source                  | high        | Current `@typed/ui` has element-specific DOM option typing embedded in Link, not a reusable map yet.                                  |
| Local `packages/ui/src/index.ts`                                                                                                                            | current `bcaf` branch            | repo source                  | high        | Current public UI surface exports only `HttpRouter` and `Link`.                                                                       |
| Local RealWorld requirements, `.docs/workflows/20260516-1826-realworld-flagship-example/requirements.md`                                                    | current `bcaf` branch            | repo docs                    | high        | RealWorld expects `@typed/ui` Link, `RefSubject`, schema boundaries, SSR, and hydration.                                              |

## WebSearch Query Log

| query                                                                                              | rationale                                     | selected_sources                                               |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `2026 web platform Baseline newly available Popover API inert dialog details MDN web.dev official` | find current Baseline and layered UI status   | web.dev Baseline; web.dev Popover Baseline; MDN Popover        |
| `MDN HTMLDialogElement showModal inert Baseline browser compatibility 2026`                        | validate native dialog modal semantics        | MDN `showModal`; MDN `<dialog>`                                |
| `MDN commandfor command buttons popover invoker commands Baseline 2026`                            | assess declarative command APIs               | MDN Invoker Commands; HTML button command examples             |
| `MDN CSS anchor positioning Baseline 2026 popover official`                                        | assess positioning substrate maturity         | MDN CSS Anchor Positioning                                     |
| `WAI ARIA APG patterns tabs radio group toolbar menu listbox combobox official current`            | identify next component contracts             | APG Tabs, Radio Group, Toolbar, Menu Button, Listbox, Combobox |
| `WAI-ARIA Authoring Practices Guide composite widget roving tabindex aria-activedescendant 2026`   | identify reusable composite focus models      | APG composite focus practice                                   |
| `Ariakit component stores composite collection tabs menu combobox documentation 2026`              | map Ariakit abstractions to Typed equivalents | Ariakit stores/providers/composite/tab/menu/select docs        |
| `Open UI component names popover selectmenu focusgroup 2026 official`                              | identify future-facing platform proposals     | Open UI home and proposal list                                 |

## Key Findings

- Baseline should be an explicit design input, not an afterthought. The platform now exposes yearly Baseline targets; Baseline 2026 is still developing, while `inert`, `<dialog>`, and Popover have earlier Baseline status. Durable components should prefer Baseline Widely Available and Baseline 2025 APIs for core behavior, and treat Baseline 2026 APIs as optional enhancements unless we explicitly choose that browser floor.
- Native layered UI is strong enough to be the default substrate. Popover is Baseline 2025 and gives declarative invokers, light dismiss, `auto`/`manual`/`hint`, `toggle` events, focus-return behavior, and implicit ARIA relationships when `popovertarget` is used. It should remain non-modal. Dialog should own modal behavior through `<dialog>.showModal()`, top layer, `::backdrop`, and inert background semantics.
- Invoker Commands are the next native escape hatch. `commandfor`/`command` can declaratively show/hide/toggle popovers and show/close/request-close dialogs. Since it is Baseline 2025, `@typed/ui` should design an abstraction that can emit either current `popovertarget` attributes or the more general command attributes without changing component state shape.
- CSS Anchor Positioning is strategically relevant but should not be a hard v1 behavior contract. It matches menus, tooltips, and popovers, and native popover relationships can create implicit anchors. However, positioning support and edge behavior are still newer than Popover/Dialog. `@typed/ui` should expose stable attributes/classes/data-state hooks and allow CSS enhancement rather than baking in a JS positioning engine.
- APG still owns composite authoring behavior. Tabs, radio groups, toolbars, menus, listboxes, and comboboxes all depend on focus management, selection state, labels, roles, and keyboard interaction. The reusable layer should be Collection + Composite before component-specific implementations.
- The two valid composite focus strategies are roving tabindex and `aria-activedescendant`. Roving tabindex should be the default because focus is real DOM focus and user agents scroll focused items into view. `aria-activedescendant` should be reserved for virtual-focus widgets such as combobox/select/listbox where DOM focus must stay on an input or composite container.
- WCAG 2.2 adds constraints that affect component APIs even when the library is headless. Focus must not be obscured, target size minimums matter, dragging must have alternatives, and authentication flows cannot require cognitive tests without alternatives. For `@typed/ui`, this means focus and target behavior must be testable, and headless primitives should not make accessible focus styling impossible.
- Ariakit's durable concepts are stores/providers, collection, composite, focusable, command, group, separator, and component-specific modules layered on top. Typed should keep similar public names where practical, but "store" should map to `RefSubject`-backed state and service/provider helpers rather than a separate store abstraction.
- The `bcaf` `@typed/ui` branch currently exposes only `HttpRouter` and `Link`. `Link.ts` embeds anchor-specific event/ref/property typing that wants to become a reusable DOM element option map before wider component work.
- Prior `@typed/ui` decisions remain coherent with standards research: Schema-backed `.data={object}` attributes, startup refs from public data attrs, native-only Popover, and `RefSubject` state all fit the platform-first direction.

## Recommendations

1. Establish `Dom.ElementOptions<Element>` before adding more components.
   - Reason: `Link.ts` already has anchor-specific event/ref/property machinery. Generalizing it avoids per-component type maintenance and lets every primitive accept native DOM options without bespoke prop lists.

2. Establish `DataAttr` and `StartupRef` before stateful widgets.
   - Reason: public `data-*` is string-backed DOM state. Schema encode/decode should be the only way component state is projected into `.data={object}` and read back from server-rendered DOM during startup.

3. Use direct `RefSubject` state, with provider helpers as ergonomics only.
   - Reason: Ariakit store capabilities map cleanly to `RefSubject`: default value, controlled externally supplied ref, update/setter helpers, event-time reads, selectors via mapped refs, and Effect Context lookup.

4. Implement Collection + Composite next.
   - Collection should own registration, item metadata, disabled state, DOM order sorting, ids, and cleanup.
   - Composite should own orientation, loop, rtl, active id, roving tabindex, optional virtual focus, and key movement.
   - This is the minimal reusable substrate for Tabs, RadioGroup, Toolbar, Menu, Select/Listbox, and Combobox.

5. Prove Composite with Tabs, RadioGroup, and Toolbar before Menu.
   - Tabs prove selected panel relationships and manual/automatic activation.
   - RadioGroup proves checked-value semantics and toolbar-nested behavior.
   - Toolbar proves one tab stop with mixed child controls.
   - Menu then composes native Popover + Composite + Command + Separator.

6. Keep Menu, Select/Listbox, and Combobox as separate milestones.
   - Menu uses command/action semantics.
   - Select/Listbox likely needs virtual focus and option/value semantics.
   - Combobox is the highest-risk widget because DOM focus usually stays on an input while active option focus is virtual.

7. Treat native platform features as a capability matrix.
   - Core: `<button>`, `<details>/<summary>`, `<dialog>`, Popover API, `inert`, `dataset`, focus APIs, form controls, ARIA roles/properties, `:focus-visible`.
   - Near-term enhancement: Invoker Commands for declarative dialog/popover commands.
   - Style/position enhancement: CSS Anchor Positioning, `:popover-open`, `::backdrop`, View Transitions where appropriate.
   - Future-watch: Open UI Focusgroup/Menu/Combobox/Customizable Select proposals; do not couple v1 behavior to proposals.

## Open Risks and Unknowns

- Browser-runner coverage is necessary for native Popover, `<dialog>`, focus return, and keyboard interaction. Unit tests in DOM simulators will not prove enough.
- Native Popover and Invoker Commands are strong, but mobile/interoperability bugs have historically mattered; component requirements should include real browser smoke tests for iOS/WebKit-sensitive behavior when feasible.
- CSS Anchor Positioning may be desirable for menu/popover examples, but a headless library should avoid owning a JS positioning replacement unless a specific product requirement demands it.
- APG examples are guidance, not normative specifications. Acceptance criteria should cite APG but verify behavior in real browser + assistive semantics where possible.
- The prior `@typed/ui` prototype is not present in `bcaf`; porting it must be planned as branch-local implementation, not assumed existing code.

## Implications for Requirements and Specification

- Requirements should say "native platform first": use semantic HTML and browser behavior where available before ARIA or custom JS.
- Requirements should distinguish modal Dialog from non-modal Popover.
- Requirements should require no custom Popover overlay, focus trap, or JS-only visibility layer for v1.
- Requirements should require `DataAttr` schemas as `Schema.Struct.Fields` for whole `.data={object}` values.
- Requirements should require startup refs to compose multiple data attrs and initialize public `RefSubject` state from DOM.
- Requirements should require reusable DOM option typing for all element-backed components.
- Requirements should require Collection and Composite as public-ish substrate modules before Tabs/RadioGroup/Toolbar.
- Requirements should require roving tabindex as the default composite strategy and virtual focus as an explicit opt-in for widgets that need it.
- Requirements should require browser-level verification for focus and native layered UI behavior.

## Alignment Notes

- specs_alignment:
  - Aligns with RealWorld requirements that `@typed/ui`, `RefSubject`, Effect Schema, SSR, and hydration participate in real application UI.
- adrs_alignment:
  - No durable ADR was changed. A later ADR should capture native platform first for layered UI if implementation proceeds.
- workflows_alignment:
  - Prior `@typed/ui` workflow is reference-only for this run. Its decisions still align with this standards research: `@typed/ui` home, Ariakit-similar public names, `RefSubject` state, Schema-backed data attrs, startup refs, and native Popover.

## Memory Promotion Candidates

- heuristic, high confidence: For `@typed/ui`, use native layered UI primitives first: `<dialog>` for modal behavior and Popover API for non-modal top-layer content; do not implement custom overlay/focus-trap behavior for Popover v1.
- heuristic, high confidence: Collection + Composite should precede Tabs, RadioGroup, Toolbar, Menu, Select/Listbox, and Combobox because APG keyboard/focus behavior repeats across those widgets.
- heuristic, medium confidence: Invoker Commands should be supported as an emitted-attribute capability, but the state model should not depend on it until the project chooses Baseline 2025+ as the browser floor.
