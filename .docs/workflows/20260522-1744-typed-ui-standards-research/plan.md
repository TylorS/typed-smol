# Typed UI Standards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for implementation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement recommendations 1-6 from the research pass: reusable DOM options, DataAttr/StartupRef, direct RefSubject state helpers, Collection + Composite, and proof widgets Tabs/RadioGroup/Toolbar while documenting Anchor Positioning as a goal.

**Architecture:** Build small modules in `packages/ui/src`, each with focused tests. Concrete widgets compose the substrate instead of duplicating keyboard/focus logic. Menu, Select/Listbox, and Combobox remain later milestones.

**Tech Stack:** TypeScript, Effect, `@typed/fx` `RefSubject`, `@typed/template`, Vitest, happy-dom.

---

## Milestone 1: DOM/Data/State Substrate

### Task 1: Reusable DOM Options

**Requirements:** FR-1, FR-2, AC-1, AC-2

- [ ] Write `packages/ui/src/Dom.test.ts` type tests for element options, event handlers, refs, and writable properties.
- [ ] Verify the test fails because `Dom.ts` does not exist.
- [ ] Add `packages/ui/src/Dom.ts`.
- [ ] Refactor `packages/ui/src/Link.ts` to use `Dom.ElementOptions<HTMLAnchorElement>`.
- [ ] Export `Dom` from `packages/ui/src/index.ts`.
- [ ] Run `pnpm --filter @typed/ui test`.

### Task 2: Schema Data Attrs and Startup Refs

**Requirements:** FR-3, FR-4, AC-3, AC-4

- [ ] Write `DataAttr.test.ts` and `StartupRef.test.ts` for whole-object `.data` encode/decode and composed startup refs.
- [ ] Verify tests fail because modules do not exist.
- [ ] Add `DataAttr.ts` and `StartupRef.ts`.
- [ ] Export both modules.
- [ ] Run `pnpm --filter @typed/ui test`.

### Task 3: RefSubject State Helper

**Requirements:** FR-5, AC-1

- [ ] Write `State.test.ts` for a service tag that carries `RefSubject.RefSubject<State>`.
- [ ] Verify test fails because `State.ts` does not exist.
- [ ] Add `State.ts`.
- [ ] Export `State`.
- [ ] Run `pnpm --filter @typed/ui test`.

## Milestone 2: Collection + Composite

### Task 4: Collection

**Requirements:** FR-6, AC-5

- [ ] Write `Collection.test.ts` for registration, cleanup, disabled filtering, and DOM-order sorting.
- [ ] Verify test fails because `Collection.ts` does not exist.
- [ ] Add `Collection.ts`.
- [ ] Export `Collection`.
- [ ] Run `pnpm --filter @typed/ui test`.

### Task 5: Composite

**Requirements:** FR-7, AC-6

- [ ] Write `Composite.test.ts` for movement, loop, disabled skipping, roving tabindex, and virtual focus.
- [ ] Verify test fails because `Composite.ts` does not exist.
- [ ] Add `Composite.ts`.
- [ ] Export `Composite`.
- [ ] Run `pnpm --filter @typed/ui test`.

## Milestone 3: Proof Widgets

### Task 6: Tabs

**Requirements:** FR-8, AC-7

- [ ] Write `Tabs.test.ts` for APG roles, selected state, panel relationships, activation modes, and data attrs.
- [ ] Verify test fails because `Tabs.ts` does not exist.
- [ ] Add `Tabs.ts`.
- [ ] Export `Tabs`.
- [ ] Run `pnpm --filter @typed/ui test`.

### Task 7: RadioGroup

**Requirements:** FR-9, AC-8

- [ ] Write `RadioGroup.test.ts` for checked value, normal arrow behavior, toolbar arrow behavior, and data attrs.
- [ ] Verify test fails because `RadioGroup.ts` does not exist.
- [ ] Add `RadioGroup.ts`.
- [ ] Export `RadioGroup`.
- [ ] Run `pnpm --filter @typed/ui test`.

### Task 8: Toolbar

**Requirements:** FR-10, AC-9

- [ ] Write `Toolbar.test.ts` for role/orientation labels and one-tab-stop movement.
- [ ] Verify test fails because `Toolbar.ts` does not exist.
- [ ] Add `Toolbar.ts`.
- [ ] Export `Toolbar`.
- [ ] Run `pnpm --filter @typed/ui test`.

## Milestone 4: Anchor Positioning and Future Milestones

### Task 9: Document Future Layered Components

**Requirements:** FR-11, FR-12, AC-10

- [ ] Update README or workflow docs with Menu, Select/Listbox, Combobox as later milestones.
- [ ] Document Anchor Positioning as a goal for future Popover/Menu examples, not a custom JS positioning engine.
- [ ] Run `pnpm --filter @typed/ui build`.

## Final Verification

- [ ] Run `pnpm --filter @typed/ui test`.
- [ ] Run `pnpm --filter @typed/ui build`.
- [ ] Commit only `packages/ui` and this workflow's docs.
