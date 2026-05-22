## Execution Summary

- Active execution approved on 2026-05-22.
- Completed T1: Schema-backed public `.data={object}` attributes.
- Completed T2: RefSubject state provider key.
- Completed T3: startup refs for DOM data hydration.
- Completed T4: Disclosure button/content primitives.

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
  - Effect v4 does not expose `Context.GenericTag` at runtime; `State.tag` uses `Context.Service` to construct the provider key.
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
  - pending
- deviations_or_replans:
  - The first return type annotation widened incorrectly around renderable services; the implementation now lets the template return type infer from generic content options.
  - Disclosure emits `data-open` through the shared `DataAttr` schema and keeps state as direct `RefSubject.RefSubject<State>`.
- context_updates:
  - none
- memory_updates:
  - candidate captured in `memory/implementation-notes.md`

## Deferred Work

- T5 through T7 remain pending.
