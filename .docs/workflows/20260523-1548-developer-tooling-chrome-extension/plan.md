# Plan - Typed DevTools Chrome Extension

Status: approved on 2026-05-23.

## Production-Grade Assessment

The earlier plan had the correct sequencing, but it was not production-grade enough for execution because it did not lock exact package boundaries, expected files, validation commands, task-level exit criteria, or dependency gates. This revision makes those explicit.

## Execution Contract

- Work proceeds task-by-task in order. Do not start a later task until every prerequisite task is verified and committed.
- Every implementation task follows red-green:
  1. write the failing focused test or type fixture;
  2. run the exact command and capture the expected failure;
  3. implement the smallest production code that passes;
  4. run the task verification command and affected package build;
  5. commit only that task's files.
- Direct `effect/unstable/rpc` imports are allowed only in `packages/devtools-protocol/src/*` and thin transport adapter files called out in this plan.
- Chrome-specific APIs are allowed only in `packages/devtools-chrome/src/*`.
- Compiler/runtime/app packages must consume `@typed/devtools-protocol` exports; they must not redeclare protocol message shapes.
- Instrumentation remains disabled by default until config/Layer opt-in tests pass.
- A task is not complete if it requires broad public `any`/`unknown`, duplicate protocol shapes, or a skipped semantic-preservation test.
- If an exact file path below conflicts with stronger local evidence discovered during execution, stop, update this plan with the replacement path and reason, then continue after approval.

## Locked Decisions

- `@typed/devtools-protocol`, `@typed/devtools-runtime`, and `@typed/devtools-chrome` are new packages under `packages/*`.
- The communication contract is `effect/unstable/rpc` RPC groups owned by `@typed/devtools-protocol`.
- Browser-only AST Analyzer is not implemented in this tranche.
- Production instrumentation is disabled by default.
- The first user-visible vertical slice is DOM/component selection linked to RefSubject state and Fx graph roots.
- Arbitrary Fx capture is implemented as a core capability, with anonymous/unowned nodes when ownership is unavailable.
- Chrome UI cannot define protocol message unions. It consumes RPC clients/adapters from the protocol package.

## Fixed Package Boundaries

| package                    | path                         | responsibility                                                                                                                         | direct dependencies                                                                       |
| -------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `@typed/devtools-protocol` | `packages/devtools-protocol` | Host-neutral ids, schemas, RPC groups, value serialization/redaction, fixtures, type tests.                                            | `effect`                                                                                  |
| `@typed/devtools-runtime`  | `packages/devtools-runtime`  | Runtime Layer, bridge handlers, event bus, DOM registry service, RefSubject/Fx capture services, Navigation/OTEL correlation adapters. | `@typed/devtools-protocol`, `@typed/fx`, `@typed/template`, `@typed/navigation`, `effect` |
| `@typed/devtools-chrome`   | `packages/devtools-chrome`   | MV3 extension shell, DevTools panel, Elements/Sources sidebars, Chrome transport adapters, smoke harness.                              | `@typed/devtools-protocol`, `effect`                                                      |

Existing packages receive narrow hook points only:

| existing package                    | allowed modifications                                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `@typed/compiler`                   | Add `src/devtools/*` fact planning, source Analyzer planning, and exports from `src/index.ts`.                 |
| `@typed/template`                   | Add compiler-runtime DOM registry hook points under `src/compiler-runtime/*`; keep render semantics unchanged. |
| `@typed/fx`                         | Add optional internal devtools hooks for `Fx` and `RefSubject`; default path must be no-op.                    |
| `@typed/app` / `@typed/vite-plugin` | Add config opt-in and generated Layer wiring after runtime package exists.                                     |
| `@typed/storybook`                  | Consume protocol fixtures only after protocol package exists.                                                  |

## Milestones

| milestone_id | objective                                                                                            | depends_on    | requirement_links                                                                               | blocking_tests          |
| ------------ | ---------------------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------- | ----------------------- |
| M1           | Protocol substrate with `effect/unstable/rpc` groups, schemas, ids, redaction, fixtures, type tests. | none          | FR-1, FR-2, FR-40 through FR-45, NFR-1, NFR-2, NFR-15 through NFR-18, AC-1, AC-11, AC-13, AC-14 | TS-1, TS-11, TS-12      |
| M2           | Compiler fact model for component/template/source/HMR/ownership/Analyzer lookup.                     | M1            | FR-12, FR-17, FR-25, FR-26, FR-32 through FR-37, NFR-7, NFR-8, AC-3, AC-6, AC-10                | TS-3, TS-6, TS-10       |
| M3           | Runtime Layer and semantic-safe instrumentation for DOM, RefSubject, Fx.                             | M1, M2        | FR-3, FR-5 through FR-24, FR-38, FR-39, NFR-3 through NFR-7, NFR-13, AC-2 through AC-5          | TS-2, TS-3, TS-4, TS-5  |
| M4           | Runtime correlation lanes for HMR aggregation, Navigation, OTEL, source Analyzer bridge.             | M1 through M3 | FR-25 through FR-29, FR-32 through FR-37, NFR-8, NFR-14, AC-6 through AC-10                     | TS-6, TS-7, TS-8, TS-10 |
| M5           | Chrome client with panel, Elements link, Sources Analyzer, reconnect behavior.                       | M1, M3, M4    | FR-30, FR-31, FR-38, FR-39, NFR-9, NFR-12, AC-9, AC-10                                          | TS-9, TS-10, TS-12      |
| M6           | Host-neutral fixtures and final critical-path validation.                                            | M1 through M5 | FR-40, NFR-10, NFR-11, AC-11, AC-12                                                             | TS-1 through TS-12      |

## Subgoal DAG

| subgoal_id | objective                                                       | prerequisites          | risk        | requirement_links                                                                        | success_check                                                                                                                               |
| ---------- | --------------------------------------------------------------- | ---------------------- | ----------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| SG-1       | Establish `@typed/devtools-protocol` and RPC contract.          | none                   | high        | FR-1, FR-2, FR-41 through FR-45, NFR-1, NFR-2, NFR-15 through NFR-18, AC-1, AC-13, AC-14 | Protocol tests/type tests pass; RPC test transport proves handshake, runtime subscription, DOM binding resolution, source analysis request. |
| SG-2       | Emit deterministic compiler facts.                              | SG-1                   | high        | FR-12, FR-17, FR-25, FR-26, FR-32 through FR-37, AC-3, AC-6, AC-10                       | Compiler fixtures produce stable ids, source spans, template paths, ownership, and HMR rejection taxonomy.                                  |
| SG-3       | Wire opt-in runtime Layer and bridge.                           | SG-1, SG-2             | high        | FR-3, FR-5 through FR-10, FR-18, FR-38, FR-39, AC-2                                      | Disabled-by-default and config-enabled fixtures pass; explicit Layer composition passes.                                                    |
| SG-4       | Capture DOM/RefSubject/Fx runtime facts without semantic drift. | SG-1 through SG-3      | high        | FR-11 through FR-24, NFR-3 through NFR-7, AC-3 through AC-5                              | DOM registry resolves selected nodes; RefSubject and Fx semantic-preservation tests pass.                                                   |
| SG-5       | Add HMR, Navigation, OTEL, Analyzer bridge correlation.         | SG-1 through SG-4      | medium-high | FR-25 through FR-29, FR-32 through FR-37, AC-6 through AC-10                             | Timeline, trace, HMR, Analyzer bridge, and unavailable-state fixtures pass.                                                                 |
| SG-6       | Build Chrome protocol client and sidebars.                      | SG-1, SG-3, SG-4, SG-5 | high        | FR-30, FR-31, FR-38, FR-39, NFR-9, NFR-12, AC-9, AC-10                                   | Chrome smoke proves connect, Elements selection, Sources Analyzer, and reload/reconnect.                                                    |
| SG-7       | Prove host-neutral fixtures and full gates.                     | SG-1 through SG-6      | medium      | FR-40, NFR-10, NFR-11, AC-11, AC-12                                                      | Storybook/protocol fixtures render without Chrome; every blocking `TS-*` scenario has a passing command and logged evidence.                |

## Concrete File Map

### New Protocol Package

- Create `packages/devtools-protocol/package.json`.
- Create `packages/devtools-protocol/tsconfig.json`.
- Create `packages/devtools-protocol/src/index.ts`.
- Create `packages/devtools-protocol/src/Ids.ts`.
- Create `packages/devtools-protocol/src/Schemas.ts`.
- Create `packages/devtools-protocol/src/Rpc.ts`.
- Create `packages/devtools-protocol/src/Serialization.ts`.
- Create `packages/devtools-protocol/src/Fixtures.ts`.
- Create tests:
  - `packages/devtools-protocol/src/Ids.test.ts`
  - `packages/devtools-protocol/src/Rpc.test.ts`
  - `packages/devtools-protocol/src/Serialization.test.ts`
  - `packages/devtools-protocol/src/typeInference.test.ts`

### New Runtime Package

- Create `packages/devtools-runtime/package.json`.
- Create `packages/devtools-runtime/tsconfig.json`.
- Create `packages/devtools-runtime/src/index.ts`.
- Create `packages/devtools-runtime/src/Layer.ts`.
- Create `packages/devtools-runtime/src/EventBus.ts`.
- Create `packages/devtools-runtime/src/Bridge.ts`.
- Create `packages/devtools-runtime/src/DomRegistry.ts`.
- Create `packages/devtools-runtime/src/RefSubjectCapture.ts`.
- Create `packages/devtools-runtime/src/FxCapture.ts`.
- Create `packages/devtools-runtime/src/NavigationCapture.ts`.
- Create `packages/devtools-runtime/src/OtelCorrelation.ts`.
- Create tests:
  - `packages/devtools-runtime/src/Layer.test.ts`
  - `packages/devtools-runtime/src/EventBus.test.ts`
  - `packages/devtools-runtime/src/Bridge.test.ts`
  - `packages/devtools-runtime/src/DomRegistry.test.ts`
  - `packages/devtools-runtime/src/RefSubjectCapture.test.ts`
  - `packages/devtools-runtime/src/FxCapture.test.ts`
  - `packages/devtools-runtime/src/NavigationCapture.test.ts`
  - `packages/devtools-runtime/src/OtelCorrelation.test.ts`

### New Chrome Package

- Create `packages/devtools-chrome/package.json`.
- Create `packages/devtools-chrome/tsconfig.json`.
- Create `packages/devtools-chrome/src/manifest.ts`.
- Create `packages/devtools-chrome/src/devtoolsPage.ts`.
- Create `packages/devtools-chrome/src/panel/index.ts`.
- Create `packages/devtools-chrome/src/panel/state.ts`.
- Create `packages/devtools-chrome/src/panel/views/*.ts`.
- Create `packages/devtools-chrome/src/elementsSidebar.ts`.
- Create `packages/devtools-chrome/src/sourcesSidebar.ts`.
- Create `packages/devtools-chrome/src/transport/chromeRuntime.ts`.
- Create `packages/devtools-chrome/src/transport/inspectedWindow.ts`.
- Create tests:
  - `packages/devtools-chrome/src/transport/chromeRuntime.test.ts`
  - `packages/devtools-chrome/src/panel/state.test.ts`
  - `packages/devtools-chrome/src/devtoolsSmoke.test.ts`

### Existing Package Hook Points

- Create `packages/compiler/src/devtools/componentFacts.ts`.
- Create `packages/compiler/src/devtools/componentFacts.test.ts`.
- Create `packages/compiler/src/devtools/hmrFacts.ts`.
- Create `packages/compiler/src/devtools/hmrFacts.test.ts`.
- Create `packages/compiler/src/devtools/sourceAnalyzer.ts`.
- Create `packages/compiler/src/devtools/sourceAnalyzer.test.ts`.
- Modify `packages/compiler/src/index.ts`.
- Create `packages/template/src/compiler-runtime/devtools.ts`.
- Create `packages/template/src/compiler-runtime/devtools.test.ts`.
- Modify `packages/template/src/compiler-runtime/dom.ts`.
- Create `packages/fx/src/Fx/devtools.ts`.
- Create `packages/fx/src/Fx.devtools.test.ts`.
- Create `packages/fx/src/RefSubject/devtools.ts`.
- Create `packages/fx/src/RefSubject.devtools.test.ts`.
- Modify `packages/fx/src/RefSubject.ts`.
- Modify `packages/fx/src/Fx/index.ts`.
- Modify `packages/fx/src/index.ts`.
- Modify `packages/app/src/config/TypedConfig.ts`.
- Modify `packages/app/src/config/defineConfig.ts`.
- Modify `packages/app/src/runtime/index.ts`.
- Add `packages/app/src/devtoolsConfig.test.ts`.

## Ordered Tasks

| task_id | owner               | files                                                                                                                                                                                                  | prerequisites      | validation_commands                                                                                                                                                                                                                                                                                                     | exit_criteria                                                                                                                                                | rollback                                                                                                           |
| ------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| T1      | protocol            | `packages/devtools-protocol/package.json`, `tsconfig.json`, `tsconfig.test.json`, `src/Ids.ts`, `src/Ids.test.ts`, `src/Ids.typecheck.ts`, `src/index.ts`, `pnpm-lock.yaml`, `scripts/publish-beta.sh` | none               | `pnpm --filter @typed/devtools-protocol test`; `pnpm --filter @typed/devtools-protocol build`                                                                                                                                                                                                                           | Package builds; branded id runtime and type tests fail first, then pass; no Chrome/runtime imports; lockfile and beta publish order include the new package. | Remove `packages/devtools-protocol`; remove publish order entry; regenerate lockfile.                              |
| T2      | protocol            | `src/Schemas.ts`, `src/Serialization.ts`, `src/Serialization.test.ts`, `src/typeInference.test.ts`                                                                                                     | T1                 | `pnpm --filter @typed/devtools-protocol test`; `pnpm --filter @typed/devtools-protocol build`                                                                                                                                                                                                                           | Schema/redaction tests pass; invalid payloads fail decoding; type inference fixture rejects broad casts.                                                     | Revert schema/serialization files.                                                                                 |
| T3      | protocol            | `src/Rpc.ts`, `src/Rpc.test.ts`, `src/Fixtures.ts`                                                                                                                                                     | T2                 | `pnpm --filter @typed/devtools-protocol test`; `pnpm --filter @typed/devtools-protocol build`                                                                                                                                                                                                                           | `RpcGroup` contains Handshake, SubscribeRuntimeEvents, ResolveDomBinding, AnalyzeSource; in-process RPC fixture passes.                                      | Revert RPC files; keep ids/schemas.                                                                                |
| T4      | compiler            | `packages/compiler/src/devtools/componentFacts.ts`, `componentFacts.test.ts`, `packages/compiler/src/index.ts`                                                                                         | T3                 | `pnpm --filter @typed/compiler exec vitest run src/devtools/componentFacts.test.ts`; `pnpm --filter @typed/compiler build`                                                                                                                                                                                              | Component fact tests pass with stable component ids, module ids, source spans, template hashes, and paths.                                                   | Revert compiler devtools component files and export.                                                               |
| T5      | compiler            | `packages/compiler/src/devtools/hmrFacts.ts`, `hmrFacts.test.ts`                                                                                                                                       | T4                 | `pnpm --filter @typed/compiler exec vitest run src/devtools/hmrFacts.test.ts`; `pnpm --filter @typed/compiler build`                                                                                                                                                                                                    | HMR facts separate optimized template status from stateful-HMR eligibility and emit structured reasons.                                                      | Revert HMR fact files.                                                                                             |
| T6      | compiler            | `packages/compiler/src/devtools/sourceAnalyzer.ts`, `sourceAnalyzer.test.ts`                                                                                                                           | T5                 | `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts`; `pnpm --filter @typed/compiler build`                                                                                                                                                                                              | Analyzer request planning maps resource URL/source map/module/range to compiler artifacts or unavailable state.                                              | Revert analyzer files.                                                                                             |
| T7      | runtime             | `packages/devtools-runtime/package.json`, `tsconfig.json`, `src/Layer.ts`, `src/Layer.test.ts`, `src/index.ts`                                                                                         | T3, T6             | `pnpm --filter @typed/devtools-runtime test`; `pnpm --filter @typed/devtools-runtime build`                                                                                                                                                                                                                             | Runtime package builds; Layer is explicit, disabled-by-default, no production capture by default.                                                            | Remove `packages/devtools-runtime`.                                                                                |
| T8      | app/runtime         | `packages/app/src/config/TypedConfig.ts`, `defineConfig.ts`, `devtoolsConfig.test.ts`, `runtime/index.ts`                                                                                              | T7                 | `pnpm --filter @typed/app exec vitest run src/devtoolsConfig.test.ts`; `pnpm --filter @typed/app build`                                                                                                                                                                                                                 | `typed.config.ts` opt-in exposes generated/provided runtime Layer; default config disables instrumentation.                                                  | Revert app config/runtime changes.                                                                                 |
| T9      | runtime             | `packages/devtools-runtime/src/EventBus.ts`, `Bridge.ts`, tests                                                                                                                                        | T7                 | `pnpm --filter @typed/devtools-runtime exec vitest run src/EventBus.test.ts src/Bridge.test.ts`; `pnpm --filter @typed/devtools-runtime build`                                                                                                                                                                          | RPC handlers return JSON-compatible summaries; reconnect state is explicit.                                                                                  | Revert event bus/bridge files.                                                                                     |
| T10     | template/runtime    | `packages/template/src/compiler-runtime/devtools.ts`, `devtools.test.ts`, `dom.ts`                                                                                                                     | T9                 | `pnpm --filter @typed/template exec vitest run src/compiler-runtime/devtools.test.ts src/compiler-runtime/dom.test.ts`; `pnpm --filter @typed/template build`                                                                                                                                                           | DOM registry resolves template hash/path/part without changing compiled DOM render output.                                                                   | Revert template devtools hook and dom changes.                                                                     |
| T11     | runtime             | `packages/devtools-runtime/src/DomRegistry.ts`, `DomRegistry.test.ts`                                                                                                                                  | T10                | `pnpm --filter @typed/devtools-runtime exec vitest run src/DomRegistry.test.ts`; `pnpm --filter @typed/devtools-runtime build`                                                                                                                                                                                          | WeakMap registry handles fragment root, comment anchor, nested ownership, and unbound node result.                                                           | Revert DomRegistry files.                                                                                          |
| T12     | fx/runtime          | `packages/fx/src/RefSubject/devtools.ts`, `packages/fx/src/RefSubject.devtools.test.ts`, `packages/fx/src/RefSubject.ts`, `packages/fx/src/index.ts`                                                   | T3, T9             | `pnpm --filter @typed/fx exec vitest run src/RefSubject.devtools.test.ts src/RefSubject.test.ts`; `pnpm --filter @typed/fx build`                                                                                                                                                                                       | RefSubject snapshots/updates/version/subscriber count/service id captured with no extra user-visible emissions.                                              | Revert RefSubject devtools hook.                                                                                   |
| T13     | runtime             | `packages/devtools-runtime/src/RefSubjectCapture.ts`, `RefSubjectCapture.test.ts`                                                                                                                      | T12                | `pnpm --filter @typed/devtools-runtime exec vitest run src/RefSubjectCapture.test.ts`; `pnpm --filter @typed/devtools-runtime build`                                                                                                                                                                                    | Redaction and bounded history enforced before bridge crossing.                                                                                               | Revert RefSubjectCapture files.                                                                                    |
| T14     | fx/runtime          | `packages/fx/src/Fx/devtools.ts`, `packages/fx/src/Fx.devtools.test.ts`, `packages/fx/src/Fx/index.ts`, `packages/fx/src/index.ts`                                                                     | T3, T9             | `pnpm --filter @typed/fx exec vitest run src/Fx.devtools.test.ts src/Fx.lifecycle.test.ts src/Fx.test.ts`; `pnpm --filter @typed/fx build`                                                                                                                                                                              | Component-owned, RefSubject-derived, and arbitrary unowned Fx capture paths pass semantic-preservation tests.                                                | Disable arbitrary Fx hook first; revert Fx hook if semantics change.                                               |
| T15     | runtime             | `packages/devtools-runtime/src/FxCapture.ts`, `FxCapture.test.ts`                                                                                                                                      | T14                | `pnpm --filter @typed/devtools-runtime exec vitest run src/FxCapture.test.ts`; `pnpm --filter @typed/devtools-runtime build`                                                                                                                                                                                            | Fx graph nodes/edges/lifetimes/emissions/failures/interruptions/completions are protocol encoded.                                                            | Revert FxCapture files.                                                                                            |
| T16     | runtime/compiler    | `packages/devtools-runtime/src/HmrCapture.ts`, `HmrCapture.test.ts`; compiler fact consumers                                                                                                           | T5, T9             | `pnpm --filter @typed/devtools-runtime exec vitest run src/HmrCapture.test.ts`; `pnpm --filter @typed/devtools-runtime build`                                                                                                                                                                                           | Runtime HMR view consumes compiler facts and preserves optimization vs stateful-HMR distinction.                                                             | Revert HMR capture files.                                                                                          |
| T17     | runtime             | `packages/devtools-runtime/src/NavigationCapture.ts`, `NavigationCapture.test.ts`                                                                                                                      | T9                 | `pnpm --filter @typed/devtools-runtime exec vitest run src/NavigationCapture.test.ts`; `pnpm --filter @typed/devtools-runtime build`                                                                                                                                                                                    | Navigation lane uses `@typed/navigation` event/state model as canonical source.                                                                              | Revert NavigationCapture files.                                                                                    |
| T18     | runtime             | `packages/devtools-runtime/src/OtelCorrelation.ts`, `OtelCorrelation.test.ts`                                                                                                                          | T9                 | `pnpm --filter @typed/devtools-runtime exec vitest run src/OtelCorrelation.test.ts`; `pnpm --filter @typed/devtools-runtime build`                                                                                                                                                                                      | OTEL `traceId`/`spanId` preserved; Typed metadata is additive and optional.                                                                                  | Revert OtelCorrelation files.                                                                                      |
| T19     | compiler/dev-server | `packages/compiler/src/devtools/sourceAnalyzer.ts`, runtime RPC handler tests                                                                                                                          | T6, T9             | `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts`; `pnpm --filter @typed/devtools-runtime exec vitest run src/Bridge.test.ts`                                                                                                                                                         | AnalyzeSource RPC returns checker-backed result or unavailable state; no AST-only fallback.                                                                  | Keep unavailable state, revert checker-backed bridge additions.                                                    |
| T20     | chrome              | `packages/devtools-chrome/package.json`, `tsconfig.json`, `src/manifest.ts`, `src/devtoolsPage.ts`, transport tests                                                                                    | T3, T9             | `pnpm --filter @typed/devtools-chrome test`; `pnpm --filter @typed/devtools-chrome build`                                                                                                                                                                                                                               | Chrome package builds; transport adapter talks to protocol RPC without local message union.                                                                  | Remove `packages/devtools-chrome`.                                                                                 |
| T21     | chrome              | `src/panel/state.ts`, `src/panel/views/components.ts`, `src/panel/views/fx.ts`, `src/panel/views/refsubjects.ts`, tests                                                                                | T20, T11, T13, T15 | `pnpm --filter @typed/devtools-chrome exec vitest run src/panel/state.test.ts`; `pnpm --filter @typed/devtools-chrome build`                                                                                                                                                                                            | Panel state renders Components/Templates, Fx, RefSubjects from protocol fixtures with stable deep links.                                                     | Hide panel views behind feature flags; revert views.                                                               |
| T22     | chrome              | `src/elementsSidebar.ts`, `src/transport/inspectedWindow.ts`, sidebar tests                                                                                                                            | T21                | `pnpm --filter @typed/devtools-chrome exec vitest run src/transport/inspectedWindow.test.ts`; `pnpm --filter @typed/devtools-chrome build`                                                                                                                                                                              | Elements selected node resolves to component/template/state/Fx summary through bridge.                                                                       | Disable sidebar registration; keep panel.                                                                          |
| T23     | chrome              | `src/sourcesSidebar.ts`, source sidebar tests                                                                                                                                                          | T19, T21           | `pnpm --filter @typed/devtools-chrome exec vitest run src/sourcesSidebar.test.ts`; `pnpm --filter @typed/devtools-chrome build`                                                                                                                                                                                         | Sources Analyzer calls AnalyzeSource RPC and renders unavailable state when bridge is missing.                                                               | Disable Sources sidebar; keep panel.                                                                               |
| T24     | chrome/runtime      | `packages/devtools-chrome/src/devtoolsSmoke.test.ts`, `packages/devtools-chrome/MANUAL_SMOKE.md`                                                                                                       | T20 through T23    | `pnpm --filter @typed/devtools-chrome exec vitest run src/devtoolsSmoke.test.ts`; `pnpm --filter @typed/devtools-chrome build`                                                                                                                                                                                          | Smoke covers connect, Elements workflow, Sources workflow, reload/reconnect; manual smoke doc lists exact browser steps for any non-automated assertion.     | Keep automated unit/integration tests; mark only browser automation as blocked in `MANUAL_SMOKE.md` with evidence. |
| T25     | fixtures            | `packages/storybook/src/devtoolsFixtures.ts`, `packages/storybook/src/devtoolsFixtures.test.ts`, `packages/devtools-protocol/src/Fixtures.ts`                                                          | T3, T21            | `pnpm --filter @typed/storybook exec vitest run src/devtoolsFixtures.test.ts`; `pnpm --filter @typed/devtools-protocol test`                                                                                                                                                                                            | Storybook/protocol fixture renders runtime facts without Chrome APIs.                                                                                        | Keep protocol fixtures only; revert Storybook fixture files.                                                       |
| T26     | final validation    | execution log and `memories.md` in workflow folder                                                                                                                                                     | T1 through T25     | `pnpm --filter @typed/devtools-protocol test`; `pnpm --filter @typed/devtools-runtime test`; `pnpm --filter @typed/devtools-chrome test`; `pnpm --filter @typed/compiler test`; `pnpm --filter @typed/template test`; `pnpm --filter @typed/fx test`; `pnpm --filter @typed/app test`; `pnpm build`; `git diff --check` | All blocking TS scenarios have evidence in execution log; memory notes capture reusable implementation lessons.                                              | Loop back to failed task; do not mark workflow complete.                                                           |

## Active Task Detail

### T2 - Protocol Schemas and Serialization

- requirement_links: FR-1, FR-2, FR-24, FR-41, FR-42, NFR-2, NFR-6, NFR-15, NFR-16, NFR-17, AC-1, AC-5, AC-13.
- write_set:
  - `packages/devtools-protocol/src/Schemas.ts`
  - `packages/devtools-protocol/src/Serialization.ts`
  - `packages/devtools-protocol/src/Serialization.test.ts`
  - `packages/devtools-protocol/src/typeInference.test.ts`
  - `packages/devtools-protocol/src/Ids.ts`
  - `packages/devtools-protocol/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memory/*`
- red_step:
  - Add serialization and schema tests that import the new modules.
  - Run `pnpm --filter @typed/devtools-protocol exec vitest run src/Serialization.test.ts src/typeInference.test.ts` and capture the missing-export evidence.
- green_step:
  - Implement host-neutral schema contracts for ids, component summaries, DOM bindings, runtime events, source analyzer requests/results, HMR facts, Navigation events, and OTEL trace spans.
  - Implement bounded JSON-compatible value serialization with redaction for sensitive keys and cyclic/unserializable values.
  - Export schema and serialization surfaces from `src/index.ts`.
  - Add type-inference tests that prove protocol payloads keep branded ids and reject invalid shapes.
- verification:
  - `pnpm --filter @typed/devtools-protocol test`
  - `pnpm --filter @typed/devtools-protocol build`
  - `rg -n "from \"(?:chrome|devtools-runtime|@typed/devtools-runtime|@typed/fx|@typed/template|@typed/navigation)|from '@typed/(?:devtools-runtime|fx|template|navigation)|\\bchrome\\." packages/devtools-protocol/src packages/devtools-protocol/package.json` must return no matches.
  - `pnpm exec oxlint packages/devtools-protocol/src`
  - `pnpm exec oxfmt --check packages/devtools-protocol/src/Ids.ts packages/devtools-protocol/src/Schemas.ts packages/devtools-protocol/src/Serialization.ts packages/devtools-protocol/src/Serialization.test.ts packages/devtools-protocol/src/typeInference.test.ts packages/devtools-protocol/src/index.ts`
  - `git diff --check -- packages/devtools-protocol .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar subagent review for schema/type inference and serialization boundary risks before commit.
  - Resolve any schema, redaction, or type-inference gaps before marking T2 complete.

### T3 - Protocol RPC Group and Fixtures

- requirement_links: FR-1, FR-2, FR-40, FR-43, FR-44, FR-45, NFR-1, NFR-17, NFR-18, AC-1, AC-11, AC-14.
- write_set:
  - `packages/devtools-protocol/src/Rpc.ts`
  - `packages/devtools-protocol/src/Rpc.test.ts`
  - `packages/devtools-protocol/src/Fixtures.ts`
  - `packages/devtools-protocol/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memory/*`
- red_step:
  - Add `Rpc.test.ts` that imports the planned RPC group and fixtures before implementation exists.
  - Run `pnpm --filter @typed/devtools-protocol exec vitest run src/Rpc.test.ts` and capture the missing-module failure.
- green_step:
  - Define protocol-owned `effect/unstable/rpc` RPCs for Handshake, SubscribeRuntimeEvents, ResolveDomBinding, and AnalyzeSource.
  - Define host-neutral protocol fixtures that reuse exported schemas/types rather than redeclaring message shapes.
  - Prove the group through `RpcTest.makeClient` with in-process handlers.
- verification:
  - `pnpm --filter @typed/devtools-protocol exec vitest run src/Rpc.test.ts`
  - `pnpm --filter @typed/devtools-protocol test`
  - `pnpm --filter @typed/devtools-protocol build`
  - `rg -n "from \"(?:chrome|devtools-runtime|@typed/devtools-runtime|@typed/fx|@typed/template|@typed/navigation)|from '@typed/(?:devtools-runtime|fx|template|navigation)|\\bchrome\\." packages/devtools-protocol/src packages/devtools-protocol/package.json` must return no matches.
  - `git diff --check -- packages/devtools-protocol .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar subagent review for unstable RPC API usage, fixture shape reuse, and type inference before commit.

### T4 - Compiler Component DevTools Facts

- requirement_links: FR-12, FR-17, FR-41, FR-42, NFR-7, NFR-15, NFR-17, AC-3, AC-13.
- write_set:
  - `packages/compiler/src/devtools/componentFacts.ts`
  - `packages/compiler/src/devtools/componentFacts.test.ts`
  - `packages/compiler/src/index.ts`
  - `packages/compiler/package.json`
  - `packages/compiler/tsconfig.json`
  - `pnpm-lock.yaml`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memory/*`
- red_step:
  - Add focused component fact tests importing the planned devtools module before implementation exists.
  - Run `pnpm --filter @typed/compiler exec vitest run src/devtools/componentFacts.test.ts` and capture the missing-module failure.
- green_step:
  - Implement deterministic component fact planning that consumes existing compiler/template/HMR facts and protocol id constructors.
  - Include stable component ids, module ids, source spans, template hash, template part paths, HMR boundary id, related RefSubject ids, and related Fx root ids.
  - Add compiler dependency and project reference for `@typed/devtools-protocol`.
- verification:
  - `pnpm --filter @typed/compiler exec vitest run src/devtools/componentFacts.test.ts`
  - `pnpm --filter @typed/compiler build`
  - `rg -n "effect/unstable/rpc|chrome\\." packages/compiler/src/devtools packages/compiler/src/index.ts` must return no matches.
  - `git diff --check -- packages/compiler package.json pnpm-lock.yaml .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar subagent review for deterministic ids, source span/part mapping, protocol dependency boundaries, and staged-index hygiene before commit.

### T5 - Compiler HMR DevTools Facts

- requirement_links: FR-17, FR-25, FR-26, FR-41, FR-42, NFR-15, NFR-17, AC-6, AC-13.
- write_set:
  - `packages/compiler/src/devtools/hmrFacts.ts`
  - `packages/compiler/src/devtools/hmrFacts.test.ts`
  - `packages/compiler/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused HMR fact tests importing the planned devtools module before implementation exists.
  - Run `pnpm --filter @typed/compiler exec vitest run src/devtools/hmrFacts.test.ts` and capture the missing-module failure.
- green_step:
  - Convert existing `CompileCapabilitiesPlan` output into protocol-owned `HmrStatusFact` values.
  - Preserve the distinction between optimized template output and stateful-HMR eligibility.
  - Map compiler rejection reasons into protocol `HmrRejectionReason` values without redefining protocol shapes.
- verification:
  - `pnpm --filter @typed/compiler exec vitest run src/devtools/hmrFacts.test.ts`
  - `pnpm --filter @typed/compiler build`
  - `rg -n "effect/unstable/rpc|chrome\\." packages/compiler/src/devtools packages/compiler/src/index.ts` must return no matches.
  - `git diff --check -- packages/compiler .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar subagent review for optimized-vs-stateful separation, rejection reason mapping, protocol dependency boundaries, and staged-index hygiene before commit.

### T6 - Compiler Source Analyzer Planning

- requirement_links: FR-32, FR-33, FR-34, FR-35, FR-36, FR-37, FR-41, FR-42, NFR-8, NFR-14, NFR-15, NFR-17, AC-10, AC-11, AC-13.
- write_set:
  - `packages/compiler/src/devtools/sourceAnalyzer.ts`
  - `packages/compiler/src/devtools/sourceAnalyzer.test.ts`
  - `packages/compiler/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused source Analyzer planner tests importing the planned devtools module before implementation exists.
  - Run `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts` and capture the missing-module failure.
- green_step:
  - Resolve protocol `SourceAnalyzerRequest.resource` against compiler artifacts by resource URL, module id, or source-map/original-resource aliases.
  - Return protocol `SourceAnalyzerResponse` source facts for compiler-derived component/template, RefSubject, and Fx/closure definitions.
  - Return explicit `Unavailable` when no compiler/dev-server artifact is available; do not add browser-only AST approximation.
- verification:
  - `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts`
  - `pnpm --filter @typed/compiler build`
  - `rg -n "effect/unstable/rpc|chrome\\." packages/compiler/src/devtools packages/compiler/src/index.ts` must return no matches.
  - `git diff --check -- packages/compiler .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar subagent review for protocol-shape reuse, artifact/resource matching, unavailable-state behavior, and staged-index hygiene before commit.

### T7 - DevTools Runtime Layer Package

- requirement_links: FR-3, FR-5, FR-8, FR-9, FR-10, FR-18, FR-38, FR-39, FR-41, FR-42, NFR-3, NFR-4, NFR-5, NFR-13, NFR-15, NFR-17, AC-2, AC-13.
- write_set:
  - `packages/devtools-runtime/package.json`
  - `packages/devtools-runtime/tsconfig.json`
  - `packages/devtools-runtime/tsconfig.test.json`
  - `packages/devtools-runtime/src/Layer.ts`
  - `packages/devtools-runtime/src/Layer.test.ts`
  - `packages/devtools-runtime/src/index.ts`
  - `pnpm-lock.yaml`
  - `scripts/publish-beta.sh`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add runtime Layer tests before implementation exists.
  - Run `pnpm --filter @typed/devtools-runtime test` and capture missing package/module wiring failure.
- green_step:
  - Create `@typed/devtools-runtime` with explicit `DevtoolsRuntime` service and `DevtoolsRuntimeLayer` constructor.
  - Keep the default Layer disabled and no-op for capture.
  - Allow explicit Layer composition to enable capture with protocol runtime events.
  - Add workspace lockfile and beta publish order wiring for the new package.
- verification:
  - `pnpm --filter @typed/devtools-runtime test`
  - `pnpm --filter @typed/devtools-runtime build`
  - `rg -n "chrome\\.|effect/unstable/rpc" packages/devtools-runtime/src packages/devtools-runtime/package.json` must return no matches.
  - `pnpm exec oxlint packages/devtools-runtime/src`
  - `pnpm exec oxfmt --check packages/devtools-runtime/src/Layer.ts packages/devtools-runtime/src/Layer.test.ts packages/devtools-runtime/src/index.ts`
  - `git diff --check -- packages/devtools-runtime pnpm-lock.yaml scripts/publish-beta.sh .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar subagent review for disabled-by-default behavior, Layer type inference, protocol dependency boundaries, and package/publish wiring before commit.

### T8 - App DevTools Config Wiring

- requirement_links: FR-3, FR-5, FR-8, FR-9, FR-10, FR-18, FR-38, FR-39, FR-41, FR-42, NFR-3, NFR-4, NFR-5, NFR-13, NFR-15, NFR-17, AC-2, AC-13.
- write_set:
  - `packages/app/package.json`
  - `packages/app/src/config/TypedConfig.ts`
  - `packages/app/src/config/index.ts`
  - `packages/app/src/devtoolsConfig.test.ts`
  - `packages/app/src/runtime/devtools.ts`
  - `packages/app/src/runtime/index.ts`
  - `pnpm-lock.yaml`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused app config tests before runtime helper wiring exists.
  - Run `pnpm --filter @typed/app exec vitest run src/devtoolsConfig.test.ts` and capture the missing runtime/config surface failure.
  - Add a focused disabled object-form session-id test and capture the explicit opt-in failure.
- green_step:
  - Add typed config `devtools` boolean/object opt-in.
  - Add app runtime helper that resolves config into an explicit `@typed/devtools-runtime` Layer.
  - Keep object-form config disabled unless `enabled: true`.
  - Wire app package dependencies on protocol/runtime without importing Chrome APIs or `effect/unstable/rpc`.
- verification:
  - `pnpm --filter @typed/app exec vitest run src/devtoolsConfig.test.ts`
  - `pnpm --filter @typed/app build`
  - `pnpm exec oxlint packages/app/src/devtoolsConfig.test.ts packages/app/src/runtime/devtools.ts packages/app/src/config/TypedConfig.ts packages/app/src/config/index.ts packages/app/src/runtime/index.ts`
  - `pnpm exec oxfmt --check packages/app/src/devtoolsConfig.test.ts packages/app/src/runtime/devtools.ts packages/app/src/config/TypedConfig.ts packages/app/src/config/index.ts packages/app/src/runtime/index.ts`
  - `rg -n "effect/unstable/rpc|chrome\\." packages/app/src/devtoolsConfig.test.ts packages/app/src/runtime/devtools.ts packages/app/src/config/TypedConfig.ts packages/app/src/config/index.ts packages/app/src/runtime/index.ts` must return no matches.
  - `git diff --check -- packages/app pnpm-lock.yaml .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar subagent review for opt-in semantics, disabled default, Layer typing, protocol dependency boundaries, and staged-index hygiene before commit.

### T9 - Runtime EventBus and Protocol Bridge

- requirement_links: FR-3, FR-5, FR-8, FR-9, FR-10, FR-18, FR-38, FR-39, FR-41, FR-42, FR-43, FR-44, FR-45, NFR-3, NFR-4, NFR-5, NFR-13, NFR-15, NFR-17, NFR-18, AC-2, AC-13, AC-14.
- write_set:
  - `packages/devtools-runtime/src/EventBus.ts`
  - `packages/devtools-runtime/src/EventBus.test.ts`
  - `packages/devtools-runtime/src/Bridge.ts`
  - `packages/devtools-runtime/src/Bridge.test.ts`
  - `packages/devtools-runtime/src/Layer.ts`
  - `packages/devtools-runtime/src/Layer.test.ts`
  - `packages/devtools-runtime/src/index.ts`
  - `packages/devtools-protocol/src/Schemas.ts`
  - `packages/devtools-protocol/src/Rpc.ts`
  - `packages/devtools-protocol/src/Fixtures.ts`
  - `packages/devtools-protocol/src/Rpc.test.ts`
  - `packages/devtools-protocol/src/Serialization.test.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused EventBus and Bridge tests before the modules exist.
  - Run `pnpm --filter @typed/devtools-runtime exec vitest run src/EventBus.test.ts src/Bridge.test.ts` and capture the missing-module failure.
- green_step:
  - Add protocol-owned replay state and stream-item schemas so reconnect state crosses the RPC boundary.
  - Implement a bounded, clone-on-write runtime event bus with capability-filtered, sequence-cursor replay.
  - Return explicit replay state for ready, partial, disabled, and session-mismatch reconnect paths before streamed events.
  - Implement protocol-owned RPC handlers through `TypedDevtoolsRpcGroup.of` without direct runtime imports from `effect/unstable/rpc`.
  - Connect `DevtoolsRuntimeService.emit` to the same EventBus consumed by the bridge.
  - Enforce the advertised bridge session against runtime event replay.
  - Provide host-neutral default unavailable/unbound bridge responses for DOM and source Analyzer requests.
- verification:
  - `pnpm --filter @typed/devtools-protocol exec vitest run src/Serialization.test.ts src/Rpc.test.ts`
  - `pnpm --filter @typed/devtools-protocol test`
  - `pnpm --filter @typed/devtools-protocol build`
  - `pnpm --filter @typed/devtools-runtime exec vitest run src/EventBus.test.ts src/Bridge.test.ts`
  - `pnpm --filter @typed/devtools-runtime test`
  - `pnpm --filter @typed/devtools-runtime build`
  - `pnpm exec oxlint packages/devtools-protocol/src packages/devtools-runtime/src`
  - `pnpm exec oxfmt --check packages/devtools-protocol/src/Schemas.ts packages/devtools-protocol/src/Rpc.ts packages/devtools-protocol/src/Fixtures.ts packages/devtools-protocol/src/Rpc.test.ts packages/devtools-protocol/src/Serialization.test.ts packages/devtools-runtime/src/EventBus.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/Layer.ts packages/devtools-runtime/src/Layer.test.ts packages/devtools-runtime/src/index.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc" packages/devtools-runtime/src packages/devtools-runtime/package.json` must return no matches.
  - `git diff --check -- packages/devtools-protocol packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar subagent review for bounded retention, reconnect state semantics, protocol handler typing, JSON compatibility, and boundary compliance before commit.

### T10 - Template DOM DevTools Hook Points

- requirement_links: FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-41, FR-42, NFR-7, NFR-15, NFR-17, AC-3, AC-13.
- write_set:
  - `packages/template/src/compiler-runtime/devtools.ts`
  - `packages/template/src/compiler-runtime/devtools.test.ts`
  - `packages/template/src/compiler-runtime/dom.ts`
  - `packages/template/src/compiler-runtime/dom.test.ts`
  - `packages/template/src/compiler-runtime/renderable.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add compiler-runtime DevTools hook tests before `devtools.ts` exists.
  - Run `pnpm --filter @typed/template exec vitest run src/compiler-runtime/devtools.test.ts src/compiler-runtime/dom.test.ts` and capture the missing-module failure.
- green_step:
  - Add host-neutral DOM template DevTools event/types for template mount, unmount, and binding metadata.
  - Allow `renderInto` callers to provide runtime DevTools hooks without changing default render behavior.
  - Notify bindings mounted through `mountDomTemplateBindings` with template hash, path, kind, value index, optional name, and the concrete node/anchor.
  - Preserve existing compiled DOM output and long-lived binding semantics.
- verification:
  - `pnpm --filter @typed/template exec vitest run src/compiler-runtime/devtools.test.ts src/compiler-runtime/dom.test.ts`
  - `pnpm --filter @typed/template build`
  - `pnpm exec oxlint packages/template/src/compiler-runtime/devtools.ts packages/template/src/compiler-runtime/devtools.test.ts packages/template/src/compiler-runtime/dom.ts packages/template/src/compiler-runtime/dom.test.ts packages/template/src/compiler-runtime/renderable.ts`
  - `pnpm exec oxfmt --check packages/template/src/compiler-runtime/devtools.ts packages/template/src/compiler-runtime/devtools.test.ts packages/template/src/compiler-runtime/dom.ts packages/template/src/compiler-runtime/dom.test.ts packages/template/src/compiler-runtime/renderable.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc" packages/template/src/compiler-runtime/devtools.ts packages/template/src/compiler-runtime/dom.ts packages/template/src/compiler-runtime/renderable.ts` must return no matches.
  - `git diff --check -- packages/template .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar subagent review for render semantic preservation, hook shape type-safety, DOM-node/anchor coverage, and boundary compliance before commit.

### T11 - Runtime DOM Registry

- requirement_links: FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-18, FR-39, FR-41, FR-42, NFR-7, NFR-15, NFR-17, AC-3, AC-13.
- write_set:
  - `packages/devtools-runtime/src/DomRegistry.ts`
  - `packages/devtools-runtime/src/DomRegistry.test.ts`
  - `packages/devtools-runtime/src/Bridge.test.ts`
  - `packages/devtools-runtime/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused DOM registry tests before `DomRegistry.ts` exists.
  - Run `pnpm --filter @typed/devtools-runtime exec vitest run src/DomRegistry.test.ts` and capture the missing-module failure.
- green_step:
  - Add a host-neutral DOM registry backed by `WeakMap<Node, DomNodeRecord>` plus protocol-id lookup for bridge requests.
  - Consume `@typed/template` compiler-runtime DevTools observer events without importing Chrome APIs.
  - Resolve selected nodes through nearest DOM ownership, including fragment roots, comment anchors, nested mounts, and unbound nodes.
  - Return protocol `DomBindingResolution` values with component summaries and template part ids when owner metadata exists.
- verification:
  - `pnpm --filter @typed/devtools-runtime exec vitest run src/DomRegistry.test.ts src/Bridge.test.ts`
  - `pnpm --filter @typed/devtools-runtime build`
  - `pnpm exec oxlint packages/devtools-runtime/src/DomRegistry.ts packages/devtools-runtime/src/DomRegistry.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `pnpm exec oxfmt --check packages/devtools-runtime/src/DomRegistry.ts packages/devtools-runtime/src/DomRegistry.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc" packages/devtools-runtime/src/DomRegistry.ts packages/devtools-runtime/src/DomRegistry.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` must return no matches.
  - `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Sidecar review is required by workflow policy, but current Codex subagent tooling only allows spawning after explicit user authorization; record direct-review rationale if authorization is still absent.

### T12 - RefSubject DevTools Hooks

- requirement_links: FR-18, FR-19, FR-23, FR-24, FR-41, FR-42, NFR-3, NFR-4, NFR-6, NFR-15, NFR-17, AC-4, AC-5, AC-13.
- write_set:
  - `packages/fx/src/RefSubject/devtools.ts`
  - `packages/fx/src/RefSubject.devtools.test.ts`
  - `packages/fx/src/RefSubject/RefSubject.ts`
  - `packages/fx/src/RefSubject/index.ts`
  - `packages/fx/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused RefSubject DevTools hook tests before `RefSubject/devtools.ts` exists.
  - Run `pnpm --filter @typed/fx exec vitest run src/RefSubject.devtools.test.ts src/RefSubject.test.ts` and capture the missing-module failure.
- green_step:
  - Add host-neutral RefSubject DevTools observer types for snapshot and update events.
  - Extend `RefSubjectOptions` with optional DevTools metadata and observer hooks.
  - Emit diagnostic-only snapshot/update events after value changes, carrying id, service id, value, version, and subscriber count.
  - Preserve RefSubject semantics: no extra user-visible emissions, equality-skipped writes remain skipped, and observer failures are swallowed.
  - Propagate `RefSubject.Service(...).make` ids into DevTools metadata when a service owns the ref.
- verification:
  - `pnpm --filter @typed/fx exec vitest run src/RefSubject.devtools.test.ts src/RefSubject.test.ts`
  - `pnpm --filter @typed/fx build`
  - `pnpm exec oxlint packages/fx/src/RefSubject/devtools.ts packages/fx/src/RefSubject.devtools.test.ts packages/fx/src/RefSubject/RefSubject.ts packages/fx/src/RefSubject/index.ts packages/fx/src/index.ts`
  - `pnpm exec oxfmt --check packages/fx/src/RefSubject/devtools.ts packages/fx/src/RefSubject.devtools.test.ts packages/fx/src/RefSubject/RefSubject.ts packages/fx/src/RefSubject/index.ts packages/fx/src/index.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc|@typed/devtools-protocol" packages/fx/src/RefSubject/devtools.ts packages/fx/src/RefSubject.devtools.test.ts packages/fx/src/RefSubject/RefSubject.ts packages/fx/src/RefSubject/index.ts packages/fx/src/index.ts` must return no matches.
  - `git diff --check -- packages/fx .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar review for RefSubject semantic preservation, observer failure isolation, service id propagation, and dependency-boundary compliance before commit.

### T13 - Runtime RefSubject Capture

- requirement_links: FR-18, FR-19, FR-23, FR-24, FR-41, FR-42, NFR-3, NFR-4, NFR-6, NFR-15, NFR-17, AC-4, AC-5, AC-13.
- write_set:
  - `packages/devtools-runtime/src/RefSubjectCapture.ts`
  - `packages/devtools-runtime/src/RefSubjectCapture.test.ts`
  - `packages/devtools-runtime/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused runtime capture tests before `RefSubjectCapture.ts` exists.
  - Run `pnpm --filter @typed/devtools-runtime exec vitest run src/RefSubjectCapture.test.ts` and capture the missing-module failure.
- green_step:
  - Convert `@typed/fx` RefSubject DevTools snapshot/update events into protocol `RuntimeEventEnvelope` values.
  - Serialize and redact raw RefSubject values with protocol serialization before emitting to the runtime bus.
  - Use stable RefSubject ids from explicit ids, service ids, or owner-qualified ids; skip unidentifiable events instead of inventing colliding anonymous ids.
  - Reuse the runtime EventBus for bounded history and bridge visibility.
- verification:
  - `pnpm --filter @typed/devtools-runtime exec vitest run src/RefSubjectCapture.test.ts src/EventBus.test.ts src/Bridge.test.ts`
  - `pnpm --filter @typed/devtools-runtime build`
  - `pnpm exec oxlint packages/devtools-runtime/src/RefSubjectCapture.ts packages/devtools-runtime/src/RefSubjectCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `pnpm exec oxfmt --check packages/devtools-runtime/src/RefSubjectCapture.ts packages/devtools-runtime/src/RefSubjectCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc" packages/devtools-runtime/src/RefSubjectCapture.ts packages/devtools-runtime/src/RefSubjectCapture.test.ts packages/devtools-runtime/src/index.ts` must return no matches.
  - `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar review for redaction, identity stability, bounded-history behavior, and runtime/protocol boundary compliance before commit.

### T14 - Fx DevTools Hooks

- requirement_links: FR-20, FR-21, FR-22, FR-23, FR-41, FR-42, NFR-3, NFR-4, NFR-6, NFR-15, NFR-17, AC-4, AC-5, AC-13.
- write_set:
  - `packages/fx/src/Fx/devtools.ts`
  - `packages/fx/src/Fx.devtools.test.ts`
  - `packages/fx/src/Fx/index.ts`
  - `packages/fx/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused Fx DevTools hook tests before `Fx/devtools.ts` exists.
  - Run `pnpm --filter @typed/fx exec vitest run src/Fx.devtools.test.ts src/Fx.lifecycle.test.ts src/Fx.test.ts` and capture the missing-module failure.
- green_step:
  - Add host-neutral Fx DevTools observer types for lifecycle phases: started, emitted, failed, completed, and interrupted.
  - Add an opt-in `withFxDevtools` wrapper that preserves the wrapped Fx success, failure, interruption, and environment semantics.
  - Carry optional component owner ids, RefSubject ids, and arbitrary unowned Fx ids without importing protocol, Chrome, or runtime packages.
  - Swallow diagnostic observer failures so DevTools instrumentation cannot add user-visible emissions or failures.
- verification:
  - `pnpm --filter @typed/fx exec vitest run src/Fx.devtools.test.ts src/Fx.lifecycle.test.ts src/Fx.test.ts`
  - `pnpm --filter @typed/fx build`
  - `pnpm exec oxlint packages/fx/src/Fx/devtools.ts packages/fx/src/Fx.devtools.test.ts packages/fx/src/Fx/index.ts packages/fx/src/index.ts`
  - `pnpm exec oxfmt --check packages/fx/src/Fx/devtools.ts packages/fx/src/Fx.devtools.test.ts packages/fx/src/Fx/index.ts packages/fx/src/index.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc|@typed/devtools-protocol" packages/fx/src/Fx/devtools.ts packages/fx/src/Fx.devtools.test.ts packages/fx/src/Fx/index.ts packages/fx/src/index.ts` must return no matches.
  - `git diff --check -- packages/fx .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar review for Fx semantic preservation, observer failure isolation, lifecycle phase accuracy, ownership metadata, and dependency-boundary compliance before commit.

### T15 - Runtime Fx Capture

- requirement_links: FR-20, FR-21, FR-22, FR-23, FR-24, FR-41, FR-42, NFR-3, NFR-4, NFR-6, NFR-15, NFR-17, AC-4, AC-5, AC-13.
- write_set:
  - `packages/devtools-runtime/src/FxCapture.ts`
  - `packages/devtools-runtime/src/FxCapture.test.ts`
  - `packages/devtools-runtime/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused runtime capture tests before `FxCapture.ts` exists.
  - Run `pnpm --filter @typed/devtools-runtime exec vitest run src/FxCapture.test.ts` and capture the missing-module failure.
- green_step:
  - Convert `@typed/fx` Fx DevTools lifecycle events into protocol `FxNodeEvent` envelopes.
  - Serialize and redact emitted values and failure/interruption causes before events enter the runtime bus.
  - Derive stable Fx node ids from component owner ids, RefSubject ids, or explicit unowned ids; skip events with no stable id.
  - Reuse the runtime EventBus for bounded history and bridge visibility.
- verification:
  - `pnpm --filter @typed/devtools-runtime exec vitest run src/FxCapture.test.ts src/EventBus.test.ts src/Bridge.test.ts`
  - `pnpm --filter @typed/devtools-runtime build`
  - `pnpm exec oxlint packages/devtools-runtime/src/FxCapture.ts packages/devtools-runtime/src/FxCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `pnpm exec oxfmt --check packages/devtools-runtime/src/FxCapture.ts packages/devtools-runtime/src/FxCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc" packages/devtools-runtime/src/FxCapture.ts packages/devtools-runtime/src/FxCapture.test.ts packages/devtools-runtime/src/index.ts` must return no matches.
  - `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar review for Fx identity stability, value/cause serialization, bounded-history behavior, lifecycle phase mapping, and runtime/protocol boundary compliance before commit.

### T16 - Runtime HMR Capture

- requirement_links: FR-17, FR-25, FR-26, FR-41, FR-42, NFR-6, NFR-8, NFR-15, NFR-17, AC-6, AC-13.
- write_set:
  - `packages/devtools-runtime/src/HmrCapture.ts`
  - `packages/devtools-runtime/src/HmrCapture.test.ts`
  - `packages/devtools-runtime/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused runtime HMR capture tests before `HmrCapture.ts` exists.
  - Run `pnpm --filter @typed/devtools-runtime exec vitest run src/HmrCapture.test.ts` and capture the missing-module failure.
- green_step:
  - Consume protocol `HmrStatusFact` values produced by compiler fact emitters without importing compiler packages.
  - Emit HMR status facts through `DevtoolsRuntimeService.emit` so EventBus retention and bridge capability filtering are reused.
  - Preserve template optimization status, stateful eligibility, unknown state, and structured rejection reasons exactly.
- verification:
  - `pnpm --filter @typed/devtools-runtime exec vitest run src/HmrCapture.test.ts src/EventBus.test.ts src/Bridge.test.ts`
  - `pnpm --filter @typed/devtools-runtime build`
  - `pnpm exec oxlint packages/devtools-runtime/src/HmrCapture.ts packages/devtools-runtime/src/HmrCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `pnpm exec oxfmt --check packages/devtools-runtime/src/HmrCapture.ts packages/devtools-runtime/src/HmrCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc|@typed/compiler" packages/devtools-runtime/src/HmrCapture.ts packages/devtools-runtime/src/HmrCapture.test.ts packages/devtools-runtime/src/index.ts` must return no matches.
  - `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar review for optimized-vs-stateful preservation, runtime/compiler dependency boundaries, EventBus reuse, and staged-index hygiene before commit.

### T17 - Runtime Navigation Capture

- requirement_links: FR-27, FR-28, FR-41, FR-42, NFR-6, NFR-14, NFR-15, NFR-17, AC-7, AC-13.
- write_set:
  - `packages/devtools-runtime/src/NavigationCapture.ts`
  - `packages/devtools-runtime/src/NavigationCapture.test.ts`
  - `packages/devtools-runtime/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused runtime Navigation capture tests before `NavigationCapture.ts` exists.
  - Run `pnpm --filter @typed/devtools-runtime exec vitest run src/NavigationCapture.test.ts` and capture the missing-module failure.
- green_step:
  - Consume `@typed/navigation` `NavigationEvent` values as the canonical runtime source.
  - Emit protocol `NavigationEvent` envelopes through `DevtoolsRuntimeService.emit` so EventBus retention and bridge capability filtering are reused.
  - Derive stable Navigation event ids from the navigation type and destination id by default, with an override for callers that need compiler/runtime correlation ids.
- verification:
  - `pnpm --filter @typed/devtools-runtime exec vitest run src/NavigationCapture.test.ts src/EventBus.test.ts src/Bridge.test.ts`
  - `pnpm --filter @typed/devtools-runtime build`
  - `pnpm exec oxlint packages/devtools-runtime/src/NavigationCapture.ts packages/devtools-runtime/src/NavigationCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `pnpm exec oxfmt --check packages/devtools-runtime/src/NavigationCapture.ts packages/devtools-runtime/src/NavigationCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc" packages/devtools-runtime/src/NavigationCapture.ts packages/devtools-runtime/src/NavigationCapture.test.ts packages/devtools-runtime/src/index.ts` must return no matches.
  - `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar review for canonical `@typed/navigation` event usage, id stability, EventBus reuse, and runtime/protocol boundary compliance before commit.

### T18 - Runtime OTEL Correlation

- requirement_links: FR-28, FR-29, FR-41, FR-42, NFR-6, NFR-14, NFR-15, NFR-17, AC-8, AC-13.
- write_set:
  - `packages/devtools-runtime/src/OtelCorrelation.ts`
  - `packages/devtools-runtime/src/OtelCorrelation.test.ts`
  - `packages/devtools-runtime/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add focused OTEL correlation tests before `OtelCorrelation.ts` exists.
  - Run `pnpm --filter @typed/devtools-runtime exec vitest run src/OtelCorrelation.test.ts` and capture the missing-module failure.
- green_step:
  - Emit protocol `OtelSpan` runtime events that preserve OpenTelemetry span name, `traceId`, and `spanId`.
  - Attach Typed ids as additive correlation metadata without inventing a parallel trace model.
  - Reuse `DevtoolsRuntimeService.emit`, EventBus retention, and bridge capability filtering.
- verification:
  - `pnpm --filter @typed/devtools-runtime exec vitest run src/OtelCorrelation.test.ts src/EventBus.test.ts src/Bridge.test.ts`
  - `pnpm --filter @typed/devtools-runtime build`
  - `pnpm exec oxlint packages/devtools-runtime/src/OtelCorrelation.ts packages/devtools-runtime/src/OtelCorrelation.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `pnpm exec oxfmt --check packages/devtools-runtime/src/OtelCorrelation.ts packages/devtools-runtime/src/OtelCorrelation.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc" packages/devtools-runtime/src/OtelCorrelation.ts packages/devtools-runtime/src/OtelCorrelation.test.ts packages/devtools-runtime/src/index.ts` must return no matches.
  - `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar review for OTEL id preservation, Typed correlation metadata boundaries, EventBus reuse, and protocol-boundary compliance before commit.

### T19 - Analyzer Bridge RPC Handler

- requirement_links: FR-32, FR-33, FR-34, FR-35, FR-36, FR-37, FR-43, FR-44, FR-45, NFR-8, NFR-14, NFR-17, NFR-18, AC-10, AC-11, AC-14.
- write_set:
  - `packages/compiler/src/devtools/sourceAnalyzer.ts`
  - `packages/compiler/src/devtools/sourceAnalyzer.test.ts`
  - `packages/devtools-runtime/src/Bridge.ts`
  - `packages/devtools-runtime/src/Bridge.test.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add a bridge test proving an injected source Analyzer handler is advertised as `source-analyzer` and returns `SourceFacts` through the bridge Analyzer path used by the protocol handlers.
  - Run `pnpm --filter @typed/devtools-runtime exec vitest run src/Bridge.test.ts` and capture the current missing capability advertisement.
- green_step:
  - Keep the runtime bridge host-neutral: it accepts a dev-server/compiler-provided Analyzer handler but does not import compiler packages or run an AST fallback.
  - Advertise `source-analyzer` by default only when an Analyzer handler is injected.
  - Preserve explicit unavailable responses when no Analyzer handler is installed.
- verification:
  - `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts`
  - `pnpm --filter @typed/compiler build`
  - `pnpm --filter @typed/devtools-runtime exec vitest run src/Bridge.test.ts`
  - `pnpm --filter @typed/devtools-runtime build`
  - `pnpm --filter @typed/devtools-runtime test`
  - `pnpm exec oxlint packages/devtools-runtime/src/Bridge.ts packages/devtools-runtime/src/Bridge.test.ts packages/compiler/src/devtools/sourceAnalyzer.ts packages/compiler/src/devtools/sourceAnalyzer.test.ts`
  - `pnpm exec oxfmt --check packages/devtools-runtime/src/Bridge.ts packages/devtools-runtime/src/Bridge.test.ts packages/compiler/src/devtools/sourceAnalyzer.ts packages/compiler/src/devtools/sourceAnalyzer.test.ts`
  - `rg -n "chrome\\.|effect/unstable/rpc|from \"@typed/compiler\"|from '@typed/compiler'" packages/devtools-runtime/src/Bridge.ts packages/devtools-runtime/src/Bridge.test.ts` must return no matches.
  - `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar review for AnalyzeSource RPC routing, capability advertisement, unavailable-state behavior, and absence of runtime AST/compiler fallback before commit.

### T20 - Chrome DevTools Package Shell and Runtime Transport

- requirement_links: FR-30, FR-31, FR-38, FR-39, FR-43, FR-44, FR-45, NFR-1, NFR-9, NFR-12, NFR-15, NFR-17, NFR-18, AC-9, AC-10, AC-14.
- write_set:
  - `packages/devtools-chrome/package.json`
  - `packages/devtools-chrome/tsconfig.json`
  - `packages/devtools-chrome/tsconfig.test.json`
  - `packages/devtools-chrome/src/index.ts`
  - `packages/devtools-chrome/src/manifest.ts`
  - `packages/devtools-chrome/src/devtoolsPage.ts`
  - `packages/devtools-chrome/src/transport/chromeRuntime.ts`
  - `packages/devtools-chrome/src/transport/chromeRuntime.test.ts`
  - `pnpm-lock.yaml`
  - `scripts/publish-beta.sh`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Create the Chrome package shell and a transport test before implementation modules exist.
  - Run `pnpm --filter @typed/devtools-chrome exec vitest run src/transport/chromeRuntime.test.ts` and capture the missing-module failure after workspace lockfile wiring exists.
- green_step:
  - Add a Manifest V3 `devtools_page` manifest helper, callback-style `chrome.devtools.panels.create` registration, and a Chrome runtime Port transport whose tag/payload/result types derive from `@typed/devtools-protocol`.
  - Keep Chrome APIs inside `@typed/devtools-chrome` and direct `effect/unstable/rpc` type imports inside the thin transport adapter.
  - Add the package to beta publish ordering after `@typed/devtools-protocol`.
- verification:
  - `pnpm --filter @typed/devtools-chrome exec vitest run src/transport/chromeRuntime.test.ts`
  - `pnpm --filter @typed/devtools-chrome test`
  - `pnpm --filter @typed/devtools-chrome build`
  - `pnpm exec oxlint packages/devtools-chrome/src`
  - `pnpm exec oxfmt --check packages/devtools-chrome/src packages/devtools-chrome/package.json packages/devtools-chrome/tsconfig.json packages/devtools-chrome/tsconfig.test.json`
  - `rg -n "effect/unstable/rpc" packages/devtools-chrome/src --glob '!transport/chromeRuntime.ts'` must return no matches.
  - `rg -n "from \"@typed/(?:devtools-runtime|compiler|fx|template|navigation|app)|from '@typed/(?:devtools-runtime|compiler|fx|template|navigation|app)|\\bchrome\\." packages/devtools-chrome/src` is allowed to match only Chrome package files and must not show non-Chrome package imports.
  - `git diff --check -- packages/devtools-chrome pnpm-lock.yaml scripts/publish-beta.sh .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar review for MV3 manifest shape, DevTools page API usage, protocol-derived transport typing, package boundary compliance, and publish/package wiring before commit.

### T21 - Chrome Panel State and Initial Views

- requirement_links: FR-30, FR-31, FR-38, FR-39, FR-40, FR-41, FR-42, NFR-9, NFR-10, NFR-12, NFR-15, NFR-17, AC-9, AC-10, AC-11, AC-13.
- write_set:
  - `packages/devtools-chrome/src/panel/state.ts`
  - `packages/devtools-chrome/src/panel/state.test.ts`
  - `packages/devtools-chrome/src/panel/views/components.ts`
  - `packages/devtools-chrome/src/panel/views/fx.ts`
  - `packages/devtools-chrome/src/panel/views/refsubjects.ts`
  - `packages/devtools-chrome/src/index.ts`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`
  - `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`
- red_step:
  - Add panel state tests before the panel modules exist.
  - Run `pnpm --filter @typed/devtools-chrome exec vitest run src/panel/state.test.ts` and capture the missing-module failure.
- green_step:
  - Accumulate protocol runtime replay/items into panel state for Components/Templates, Fx, and RefSubjects.
  - Expose small view-model functions for Components, Fx, and RefSubjects so Chrome UI can render from protocol facts without importing runtime/compiler packages.
  - Preserve stable deep-link ids from protocol identifiers and keep reconnect/replay state visible to the panel model.
- verification:
  - `pnpm --filter @typed/devtools-chrome exec vitest run src/panel/state.test.ts`
  - `pnpm --filter @typed/devtools-chrome test`
  - `pnpm --filter @typed/devtools-chrome build`
  - `pnpm exec oxlint packages/devtools-chrome/src`
  - `pnpm exec oxfmt --check packages/devtools-chrome/src`
  - `rg -n "from \"@typed/(?:devtools-runtime|compiler|fx|template|navigation|app)|from '@typed/(?:devtools-runtime|compiler|fx|template|navigation|app)'" packages/devtools-chrome/src/panel packages/devtools-chrome/src/index.ts` must return no matches.
  - `git diff --check -- packages/devtools-chrome .docs/workflows/20260523-1548-developer-tooling-chrome-extension`
- review:
  - Run sidecar review for protocol-only state derivation, view-model stability, deep-link ids, replay/reconnect handling, and package boundary compliance before commit.

## Verification Matrix

| scenario                       | required commands                                                                                                                                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TS-1 Protocol contract         | `pnpm --filter @typed/devtools-protocol test`; `pnpm --filter @typed/devtools-protocol build`                                                                                                                                                               |
| TS-2 Opt-in instrumentation    | `pnpm --filter @typed/app exec vitest run src/devtoolsConfig.test.ts`; `pnpm --filter @typed/devtools-runtime test`                                                                                                                                         |
| TS-3 DOM/component correlation | `pnpm --filter @typed/compiler exec vitest run src/devtools/componentFacts.test.ts`; `pnpm --filter @typed/template exec vitest run src/compiler-runtime/devtools.test.ts`; `pnpm --filter @typed/devtools-runtime exec vitest run src/DomRegistry.test.ts` |
| TS-4 Fx capture semantics      | `pnpm --filter @typed/fx exec vitest run src/Fx.devtools.test.ts src/Fx.lifecycle.test.ts src/Fx.test.ts`; `pnpm --filter @typed/devtools-runtime exec vitest run src/FxCapture.test.ts`                                                                    |
| TS-5 RefSubject inspection     | `pnpm --filter @typed/fx exec vitest run src/RefSubject.devtools.test.ts src/RefSubject.test.ts`; `pnpm --filter @typed/devtools-runtime exec vitest run src/RefSubjectCapture.test.ts`                                                                     |
| TS-6 HMR status                | `pnpm --filter @typed/compiler exec vitest run src/devtools/hmrFacts.test.ts`; `pnpm --filter @typed/devtools-runtime exec vitest run src/HmrCapture.test.ts`                                                                                               |
| TS-7 Navigation timeline       | `pnpm --filter @typed/devtools-runtime exec vitest run src/NavigationCapture.test.ts`                                                                                                                                                                       |
| TS-8 OTEL correlation          | `pnpm --filter @typed/devtools-runtime exec vitest run src/OtelCorrelation.test.ts`                                                                                                                                                                         |
| TS-9 Chrome panel and Elements | `pnpm --filter @typed/devtools-chrome test`; `pnpm --filter @typed/devtools-chrome build`                                                                                                                                                                   |
| TS-10 Sources Analyzer         | `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts`; `pnpm --filter @typed/devtools-chrome exec vitest run src/sourcesSidebar.test.ts`                                                                                      |
| TS-11 Type inference           | `pnpm --filter @typed/devtools-protocol exec vitest run src/typeInference.test.ts`; `pnpm --filter @typed/devtools-protocol build`                                                                                                                          |
| TS-12 RPC transport adapters   | `pnpm --filter @typed/devtools-protocol exec vitest run src/Rpc.test.ts`; `pnpm --filter @typed/devtools-chrome exec vitest run src/transport/chromeRuntime.test.ts`                                                                                        |
| Release gate                   | `pnpm build`; `git diff --check`                                                                                                                                                                                                                            |

## Commit Boundaries

Each task gets one conventional commit after its validation commands pass. Suggested messages:

| tasks   | commit message                                                      |
| ------- | ------------------------------------------------------------------- |
| T1-T3   | `feat(devtools): add typed protocol rpc substrate`                  |
| T4-T6   | `feat(devtools): add compiler facts and analyzer planning`          |
| T7-T9   | `feat(devtools): add runtime layer and bridge`                      |
| T10-T15 | `feat(devtools): instrument dom state and fx runtime facts`         |
| T16-T19 | `feat(devtools): add hmr navigation traces and analyzer bridge`     |
| T20-T24 | `feat(devtools): add chrome devtools client shell`                  |
| T25-T26 | `test(devtools): add host-neutral fixtures and validation evidence` |

When a group takes multiple work sessions, commit each task independently with the same prefix and a narrower subject.

## Tactical Replanning Triggers

- A planned file path conflicts with existing ownership after reading the target files.
- A protocol type test requires broad casts or duplicated message shapes.
- An `effect/unstable/rpc` API mismatch requires changing the adapter boundary.
- Compiler fact emission changes existing template/HMR behavior.
- Fx instrumentation changes laziness, sharing, interruption, scope cleanup, error/success, or service requirements.
- RefSubject instrumentation adds user-visible emissions or leaks values beyond redaction limits.
- DOM registry cannot handle fragments/comment anchors/hydration/HMR replacement for the first fixture.
- Chrome MV3 lifecycle breaks assumed session ownership.
- Analyzer bridge cannot map DevTools source identity to compiler artifacts.
- A blocking `TS-*` scenario lacks a concrete verification command.

When triggered, update this plan and re-run approval for the affected section before implementing that section.

## Rollback and Compensation Policy

- New packages can be removed as whole directories until downstream tasks depend on them.
- Hook points in existing packages must be behind no-op defaults so they can be disabled independently.
- If arbitrary Fx capture destabilizes semantics, keep component-owned and RefSubject-derived capture and record arbitrary capture as blocked with failing evidence.
- If Chrome e2e automation is blocked by extension tooling, require a documented manual smoke and keep unit/integration tests passing.
- If Analyzer bridge cannot resolve original source maps, ship unavailable/degraded state only; do not add browser-only AST approximation.

## Mutating-Action Safeguards

- Stage changes by package/lane and commit after each verified task.
- Keep protocol package host-neutral; reject Chrome imports outside `packages/devtools-chrome`.
- Keep direct `effect/unstable/rpc` imports inside `packages/devtools-protocol` and named transport adapter files.
- Keep instrumentation behind config/Layer gates until each lane is verified.
- Add negative tests for production/no-op behavior before wiring runtime capture broadly.
- Run `git diff --check` before every commit.
- Do not modify unrelated dirty files from concurrent agents.

## Memory Plan

- capture:
  - task-specific implementation notes in `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/memories.md`;
  - verification commands and exact blockers in `.docs/workflows/20260523-1548-developer-tooling-chrome-extension/execution-log.md`;
  - decisions that affect package boundaries, protocol ids, and instrumentation semantics.
- promotion_criteria:
  - promote only durable, reusable rules after a task is verified and committed;
  - include failures that would change future Typed DevTools work, especially RPC transport or Fx semantic-preservation lessons.
- recall_targets:
  - `.docs/specs/typed-devtools/spec.md`;
  - `.docs/specs/typed-devtools/testing-strategy.md`;
  - `.docs/adrs/20260523-1703-typed-devtools-protocol-boundaries.md`;
  - `.docs/adrs/20260521-2320-runtime-template-compiler-boundaries.md`;
  - `.docs/adrs/20260522-2124-compiler-direct-transforms-and-extensible-vmc.md`;
  - `.docs/specs/virtual-modules/spec.md`;
  - `.docs/specs/virtual-module-artifact-store/spec.md`.
