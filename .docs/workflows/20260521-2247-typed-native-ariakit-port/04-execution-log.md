## Execution Summary

- Active execution approved on 2026-05-22.
- Completed T1: Schema-backed public `.data={object}` attributes.
- Completed T2: RefSubject state provider key.
- Completed T3: startup refs for DOM data hydration.
- Completed T4: Disclosure button/content primitives.
- Completed T5: Dialog content/trigger/close primitives.
- Completed T6: native Popover primitives.
- Completed T7: exports, README, and full `@typed/ui` verification.

## Task Records

### Task T1 - Schema-Backed Public Data Attributes

- task_id: T1
- requirement_ids:
  - FR-8
  - FR-9
  - FR-10
  - FR-20
  - NFR-2
- ts_scenarios:
  - TS-2: pass
- validation_evidence:
  - RED: `pnpm --filter @typed/ui test -- DataAttr` failed because `./DataAttr.js` was missing.
  - GREEN: `pnpm --filter @typed/ui test -- DataAttr` passed with `3` files and `21` tests.
  - PACKAGE: `pnpm --filter @typed/ui test` passed with `3` files and `21` tests.
  - BUILD: `pnpm --filter @typed/ui build` passed.
- commit:
  - `50b39c2 feat(ui): add schema data attributes`
- deviations_or_replans:
  - The initial test used `Schema.Literal("top", "bottom")`, but this Effect version treats `Schema.Literal` as a single-literal schema. The test was corrected to use `Schema.Literals([...])`.
  - The implementation narrowed data field schemas to service-free `Schema.Codec<any, any, never, never>` so DataAttr encode/decode effects do not introduce unknown service requirements.
- context_updates:
  - none
- memory_updates:
  - candidate captured in `memory/implementation-notes.md`

### Task T2 - RefSubject State Providers

- task_id: T2
- requirement_ids:
  - FR-6
  - FR-7
  - NFR-2
  - NFR-4
- ts_scenarios:
  - TS-1: pass
- validation_evidence:
  - RED: `pnpm --filter @typed/ui test -- State` failed because `./State.js` was missing.
  - GREEN: `pnpm --filter @typed/ui test -- State` passed with `4` files and `24` tests.
  - PACKAGE: `pnpm --filter @typed/ui test` passed with `4` files and `24` tests.
  - BUILD: `pnpm --filter @typed/ui build` passed.
- commit:
  - `799a72e feat(ui): add refsubject state helpers`
- deviations_or_replans:
  - Effect v4 does not expose `Context.GenericTag` at runtime; `State.Service` uses `Context.Service` to construct the provider key.
- context_updates:
  - none
- memory_updates:
  - candidate captured in `memory/implementation-notes.md`

### Task T3 - Ref Startup Hydration

- task_id: T3
- requirement_ids:
  - FR-5
  - FR-8
  - FR-9
  - FR-11
  - FR-20
  - NFR-2
- ts_scenarios:
  - TS-3: pass
- validation_evidence:
  - RED: `pnpm --filter @typed/ui test -- StartupRef` failed because `./StartupRef.js` was missing.
  - GREEN: `pnpm --filter @typed/ui test -- StartupRef` passed with `5` files and `27` tests.
  - PACKAGE: `pnpm --filter @typed/ui test` passed with `5` files and `27` tests.
  - BUILD: `pnpm --filter @typed/ui build` passed.
- commit:
  - `2359be2 feat(ui): add startup data refs`
- deviations_or_replans:
  - `StartupRef.fromData` merges decoded data fields into the existing state instead of replacing the full state so component-local state can survive startup hydration.
  - `StartupRef.compose` was added to support one template `ref` callback composed from multiple startup refs.
- context_updates:
  - none
- memory_updates:
  - candidate captured in `memory/implementation-notes.md`

### Task T4 - Disclosure

- task_id: T4
- requirement_ids:
  - FR-8
  - FR-9
  - FR-12
  - FR-19
  - NFR-1
  - NFR-2
  - NFR-3
- ts_scenarios:
  - TS-4: pass
- validation_evidence:
  - RED: `pnpm --filter @typed/ui test -- Disclosure` failed because `./Disclosure.js` was missing.
  - GREEN: `pnpm --filter @typed/ui test -- Disclosure` passed with `6` files and `30` tests.
  - PACKAGE: `pnpm --filter @typed/ui test` passed with `6` files and `30` tests.
  - BUILD: `pnpm --filter @typed/ui build` passed.
- commit:
  - `bd66d9c feat(ui): add disclosure primitives`
- deviations_or_replans:
  - The first return type annotation widened incorrectly around renderable services; the implementation now lets the template return type infer from generic content options.
  - Disclosure emits `data-open` through the shared `DataAttr` schema and keeps state as direct `RefSubject.RefSubject<State>`.
- context_updates:
  - none
- memory_updates:
  - candidate captured in `memory/implementation-notes.md`

### Task T5 - Dialog

- task_id: T5
- requirement_ids:
  - FR-8
  - FR-9
  - FR-13
  - FR-14
  - FR-19
  - NFR-1
  - NFR-2
  - NFR-3
- ts_scenarios:
  - TS-5: pass
- validation_evidence:
  - RED: `pnpm --filter @typed/ui test -- Dialog` failed because `./Dialog.js` was missing.
  - GREEN: `pnpm --filter @typed/ui test -- Dialog` passed with `7` files and `33` tests.
  - PACKAGE: `pnpm --filter @typed/ui test` passed with `7` files and `33` tests.
  - BUILD: `pnpm --filter @typed/ui build` passed.
- commit:
  - `6e655b4 feat(ui): add dialog primitives`
- deviations_or_replans:
  - Browser-runner wiring was not added because `@typed/ui` does not currently link `@vitest/browser-playwright` and `pnpm-lock.yaml` had unrelated dirty changes before this task.
  - Focus return is covered in happy-dom by rendering trigger and close controls in separate roots so event handlers stay mounted.
- context_updates:
  - none
- memory_updates:
  - candidate captured in `memory/implementation-notes.md`

### Task T6 - Native Popover

- task_id: T6
- requirement_ids:
  - FR-8
  - FR-9
  - FR-15
  - FR-16
  - FR-17
  - FR-19
  - NFR-1
  - NFR-2
  - NFR-3
- ts_scenarios:
  - TS-6: pass
- validation_evidence:
  - RED: `pnpm --filter @typed/ui test -- Popover` failed because `./Popover.js` was missing.
  - GREEN: `pnpm --filter @typed/ui test -- Popover` passed with `8` files and `36` tests.
  - PACKAGE: `pnpm --filter @typed/ui test` passed with `8` files and `36` tests.
  - BUILD: `pnpm --filter @typed/ui build` passed.
- commit:
  - `402a09a feat(ui): add native popover primitives`
- deviations_or_replans:
  - Browser-runner wiring remains deferred because `@typed/ui` does not currently link `@vitest/browser-playwright` and `pnpm-lock.yaml` had unrelated dirty changes before this task.
  - Popover tests assert native trigger/content attributes, native `toggle` event mirroring, and absence of custom overlay/focus-trap elements.
- context_updates:
  - none
- memory_updates:
  - candidate captured in `memory/implementation-notes.md`

### Task T7 - Exports, Documentation, and Full Verification

- task_id: T7
- requirement_ids:
  - FR-1
  - FR-2
  - FR-19
  - FR-20
  - NFR-7
- validation_evidence:
  - PACKAGE: `pnpm --filter @typed/ui test` passed with `8` files and `36` tests.
  - BUILD: `pnpm --filter @typed/ui build` passed.
- commit:
  - `bbd99bc docs(ui): document component tranche`
- deviations_or_replans:
  - Browser verification remains documented as a limitation because `@typed/ui` does not currently link `@vitest/browser-playwright` and `pnpm-lock.yaml` had unrelated dirty changes before this workflow slice.
- context_updates:
  - none
- memory_updates:
  - implementation notes updated.

## Deferred Work

- Browser-runner wiring was added in the parity-closure pass with `packages/ui/vitest.browser.config.ts`, `test:browser`, and a native overlay baseline smoke.
- Parity-closure pass added `ariakit-parity-matrix.md` and expanded implementation coverage for Composite keyboard movement, native popover initial-open hydration, CSS anchor-positioning attributes, Combobox popup linkage/keyboard behavior, Hovercard close lifecycle, and keyed Form field names.
- Remaining gaps are tracked explicitly in `ariakit-parity-matrix.md`.
- Parity-closure verification: `pnpm --filter @typed/ui test` passed with 24 files and 93 tests; `pnpm --filter @typed/ui build` passed; `pnpm --filter @typed/ui exec vitest typecheck --run src/ComponentOptions.test.ts` passed with 4 type-test cases; `pnpm --filter @typed/ui run test:browser` passed with 1 file and 2 tests.
