## Problem Statement

Typed currently has a small `@typed/ui` browser integration layer, but it does not yet have a broad accessible component toolkit comparable to Ariakit.

The problem is to design a Typed-native component system that preserves Ariakit-like capabilities while fitting Typed's Effect-native, template-first, virtual-module-first architecture.

## Desired Outcomes

- A clear product and API direction for a Typed-native accessible component package.
- A mapped component surface from Ariakit into Typed concepts.
- A first milestone boundary small enough for red/green implementation, starting with the abstract substrate before minimal concrete widgets and composite-heavy parity work.
- A research path that includes Ariakit behavior, WAI-ARIA/APG patterns, and existing Typed primitives.
- Requirements and later tasks that trace to accessibility behavior, state-store behavior, SSR/hydration behavior, and composition behavior.

## Constraints and Assumptions

- The workflow uses strict mode with PR finalization.
- Phase 1 ends after `intent.md` and `scope.md` are explicitly approved and committed.
- Existing workflow folders are reference-only.
- The implementation must not copy Ariakit internals directly.
- The design should be React-free and should use Typed's `@typed/template`, `@typed/fx`, `@typed/ui`, and Effect patterns.
- The component system belongs in `@typed/ui`; this is not a separate `@typed/components` or `@typed/ariakit` package.
- Public API names should stay similar to Ariakit where practical.
- State architecture should be hybrid: explicit store values plus provider/context helpers backed by Effect services/Layers.
- Initial styling scope is headless behavior plus stable `data-*` state attributes, with no first-party CSS in the initial scope.
- Public styling/inspection `data-*` attributes should have Schema-backed encoding/decoding helpers.
- Component startup should include a ref-based abstraction for initializing backing `RefSubject`s from server-emitted DOM state.
- Framework additions must preserve the accepted virtual-module-first architecture.
- Current dirty files in the worktree are unrelated and must not be reverted.
- The subagent routing policy was reviewed. Direct execution is used because the available subagent tool requires explicit user authorization for delegation.

## Known Unknowns and Risks

- The user may want complete Ariakit capability parity, or may want a smaller foundational first slice.
- Accessibility scope is large; full parity across Combobox, Menu, Select, Tabs, Dialog, Tooltip, and composite behavior is too broad for a single first implementation task.
- Browser/screen-reader behavior may require Playwright/browser tests beyond unit and property tests.
- Encoding rich state into `data-*` attributes can become leaky or unsafe; for now, `data-*` is public styling/inspection state only.
- RefSubject startup hydration must avoid per-component ad hoc DOM parsing.

## Candidate Approaches

### Approach 1: Abstract Substrate First

Build the foundation first: Role, Focusable, Collection, Composite, Group, Separator, and Command.

Pros:

- Matches Ariakit's abstract primitive layer.
- Makes Menu, Select, Combobox, Tab, Toolbar, and Radio easier to implement correctly.
- Best fit for property/state-machine tests.

Cons:

- Less immediately visible to application authors.
- Requires careful design before demonstrating concrete value.

### Approach 2: User-Facing Minimal Kit First

Build Button, Checkbox, Disclosure, Dialog, Popover, and Tooltip first.

Pros:

- Produces usable components quickly.
- Exercises visibility state, focus restoration, native overlays, and event handlers.
- Easier to document and demo early.

Cons:

- Risks ad hoc internals if the composite/collection substrate is deferred too far.
- Does not prove Ariakit's hardest capability area.

### Approach 3: Composite-Heavy Proof First

Build Composite, Menu, Select, Combobox, and Tab early.

Pros:

- Tests the most important Ariakit differentiator.
- Forces the store/provider/navigation architecture to be real.
- Directly targets command palette and searchable select compositions.

Cons:

- Broadest and riskiest first slice.
- Harder to stabilize without an already-approved substrate model.

## Recommendation

Prefer Approach 1 with one concrete vertical slice attached.

The likely first milestone should define a small reusable substrate, then prove it with either Disclosure/Dialog/Popover or Composite/Menu. This gives the design a durable foundation without letting the first PR become a mostly invisible abstraction exercise.

Human-selected sequencing:

1. Abstract substrate first.
2. Minimal usable kit second.
3. Composite-heavy proof third.

The first substrate milestone should be proven with Disclosure, Dialog, and Popover.

## Source Grounding

- consulted_specs:
  - `.docs/specs/typed-framework-starter/spec.md` for current framework/package boundaries and virtual module surfaces.
  - `.docs/specs/router-virtual-module-plugin/spec.md` and `.docs/specs/httpapi-virtual-module-plugin/spec.md` as reference context for explicit generated surfaces.
- consulted_adrs:
  - `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md` for the constraint that framework features remain explicit virtual modules rather than hidden framework ownership.
- consulted_workflows:
  - `.docs/workflows/20260516-1600-typed-framework-starter/*` as transient background for current framework starter decisions.
- consulted_code:
  - `packages/ui/README.md`, `packages/ui/src/Link.ts`, and `packages/ui/src/index.ts` for the current UI package shape.
  - `packages/template/README.md` for templates, SSR, hydration, EventHandler, RenderTemplate, and RenderEvent capabilities.
  - `packages/template/src/Render.ts` and hydration/render tests for existing `data-*` interpolation and hydration behavior.
  - `examples/todomvc/src/domain.ts` for existing Effect Schema encode/decode typing patterns.
  - `examples/todomvc/src/presentation.ts` and `examples/todomvc/src/application.ts` for existing RefSubject + template + application service patterns.
- consulted_external:
  - Ariakit components page, version v0.4.26, for the concrete and abstract component inventory.
  - Ariakit API reference for store/provider/component families.
  - Ariakit GitHub repository for package/license context.
  - W3C WAI-ARIA APG pattern index, Combobox pattern, Dialog pattern, and Menu Button pattern for accessibility behavior grounding.

## Initial Memory Strategy

- Capture short-term decisions and rejected options under `memory/` once Phase 1 intent and scope are approved.
- Promote only durable decisions to `.docs/_meta/memory/` after implementation evidence exists.
- Do not duplicate Ariakit or APG definitions across docs; link to the research artifact once created.
