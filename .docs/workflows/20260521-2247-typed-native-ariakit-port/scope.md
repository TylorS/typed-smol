# Scope - Typed Native Ariakit Port

## Scope Draft

This workflow is for the conceptual and implementation plan for a Typed-native accessible component system with Ariakit-like capabilities.

## In Scope For Discovery

- Ariakit component and API surface mapping.
- WAI-ARIA/APG pattern research for the component families Ariakit implements.
- Existing Typed primitives that can host the design:
  - `@typed/template` templates, SSR, hydration, EventHandler, and RenderTemplate.
  - `@typed/fx` Fx and RefSubject reactive state.
  - `@typed/ui` as the intended home for the accessible component system, expanding beyond its current browser integration helpers.
  - Effect Context, Layer, Scope, and service composition.
- API architecture for stores, providers, abstract primitives, concrete components, and composition between components.
- Schema-backed encoding and decoding helpers for public `data-*` state attributes.
- A ref-based startup abstraction that initializes backing `RefSubject`s from server-emitted DOM state.
- Testing strategy for accessibility behavior, keyboard interaction, SSR/hydration, and property/state-machine tests.
- Milestone sequencing for a useful first port.

## Candidate Implementation Scope

Current human-selected sequencing:

1. Abstract substrate first.
2. Minimal usable kit second.
3. Composite-heavy proof third.

The first milestone should attach Disclosure, Dialog, and Popover as a concrete vertical slice proving the substrate.

Candidate slices:

1. Abstract substrate first:
   - Role, Focusable, Collection, Composite, Portal, Group, Separator, Command.
   - This creates the behavior foundation for richer widgets.
2. User-facing minimal kit first:
   - Button, Checkbox, Disclosure, Dialog, Popover, Tooltip.
   - This proves public ergonomics quickly while still exercising focus and visibility state.
3. Composite-heavy proof first:
   - Composite, Menu, Select, Combobox, Tab.
   - This targets Ariakit's hardest capability area early.

## Out Of Scope Until Approved

- Copying Ariakit implementation code directly.
- React compatibility wrappers.
- Full visual design system or CSS framework.
- Shipping/publishing packages.
- Replacing current router, app, or template architecture.
- Actual filesystem routing or hidden framework ownership.
- Broad code edits before requirements and plan approval.

## Current Constraints

- Strict stage order applies: brainstorming, research, requirements, specification, planning, execution, finalization.
- Phase 1 artifacts must be explicitly approved by the human before commit and continuation.
- Code implementation must use failing tests first once execution begins.
- Favor property tests over example-only tests when possible.
- Prefer small, atomic functions and typed functional design.
- Keep changes scoped; the current worktree has unrelated dirty files that must not be reverted.
- The component system belongs in `@typed/ui`; a new package is out of scope unless the human reverses this decision.
- Public API names should stay similar to Ariakit where practical, while still fitting Typed's Effect/template model.
- State architecture should be hybrid: explicit store values plus provider/context helpers backed by Effect services/Layers.
- Initial styling scope is headless behavior plus stable `data-*` state attributes. First-party CSS is out of scope.
- Public styling/inspection `data-*` attributes should be easy to encode/decode through Effect Schema.
- Internal hydration state is out of scope for `data-*` for now; refs should initialize backing `RefSubject`s from the DOM on startup.
- Popover must be backed by the native HTML Popover API only. Custom overlay mechanics, custom popover focus trapping, and JS-only popover visibility are out of scope for Popover v1.

## Open Scope Questions

- Does the human approve `intent.md` and `scope.md` for Phase 1 commit and continuation to research?
