# Requirements - Typed UI Menu Layer

Status: approved by human on 2026-05-22 with "That all sounds great" after Menu-first design proposal.

## Functional Requirements

- FR-1: Export `Menu` from `@typed/ui`.
- FR-2: `Menu` state must be a direct `RefSubject.RefSubject<Menu.State>`, not a store wrapper.
- FR-3: `Menu.Trigger` must use native Popover trigger attributes.
- FR-4: `Menu.Content` must use native `popover` and APG `role="menu"` semantics.
- FR-5: `Menu.Item` must emit APG `role="menuitem"` semantics and public data attrs.
- FR-6: Menu movement helpers must skip disabled items, respect DOM order when elements are present, support loop boundaries, and update active item state.
- FR-7: Component option APIs must preserve renderable error/service inference from non-content options via `Opts extends MenuOptions` style generics.

## Non-Functional Requirements

- NFR-1: Use TDD.
- NFR-2: Keep implementation small and consistent with existing `packages/ui` modules.
- NFR-3: Use native Popover only. No custom overlay, focus trap, or positioning engine.
- NFR-4: Avoid unrelated worktree changes.

## Acceptance Criteria

- AC-1: `@typed/ui` exports `Menu`.
- AC-2: Tests prove native trigger/content attributes, roles, and data attrs.
- AC-3: Tests prove toggle events mirror native Popover state into the backing RefSubject.
- AC-4: Tests prove movement skips disabled items and loops.
- AC-5: Type tests prove non-content options preserve errors/services.
- AC-6: `pnpm --filter @typed/ui test` and `pnpm --filter @typed/ui build` pass.
