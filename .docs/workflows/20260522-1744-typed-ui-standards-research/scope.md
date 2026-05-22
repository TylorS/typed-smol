# Scope - Typed UI Standards Research

## In Scope

- Current `bcaf` worktree state for `packages/ui`.
- Official platform references for HTML, Popover API, `<dialog>`, Invoker Commands, CSS Anchor Positioning, Baseline, and WCAG/APG.
- Ariakit public documentation for stores/providers and composite-heavy components.
- Typed-specific implications for:
  - `RefSubject`-backed state instead of stores as a separate abstraction.
  - Effect Schema-backed `data-*` encode/decode.
  - ref-based startup hydration from public DOM state.
  - reusable DOM option typing.
  - native-only Popover behavior.

## Out of Scope

- Implementing `@typed/ui` primitives.
- Updating tests or adding browser-runner dependencies.
- Reusing prior workflow folders as writable stage artifacts.
- Making requirements final without explicit human approval.

## Routing Notes

- Task shape: specialist research plus standards synthesis.
- Repo policy would normally route to research and requirements specialists.
- Available subagent tool policy only permits spawning when the user explicitly asks for subagents, so this pass is direct execution with the deviation recorded.
