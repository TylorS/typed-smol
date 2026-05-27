# Plan - DevTools RealWorld End-To-End Proof

Status: approved on 2026-05-26 after production-grade review.

## Execution Status

| task_id | status | latest evidence |
| ------- | ------ | --------------- |
| T0 | completed on 2026-05-26 20:01 EDT | Preflight facts recorded in `memories.md`: dirty state, missing `hurl`, and package test baselines. |
| T1 | focused slice accepted; full check blocked externally | Focused Vitest gate passes; `pnpm --filter typed-realworld check` is blocked by existing dirty `CommentForm.ts` formatting and generated HttpApi `OpenApiModule` type error outside this slice. |
| T2 | completed on 2026-05-26 20:11 EDT | Existing implementation already satisfies shared runtime/bridge wiring; focused app gate passed with 3 files, 18 tests, no type errors. |

## Subgoal DAG

| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| ---------- | --------- | ------------- | ---- | ----------------- | ------------- |
| SG-0 | Establish proof preflight and ownership boundaries | approved spec/testing strategy | medium | NFR-9, NFR-10, NFR-12, NFR-13, AC-12, AC-13 | Dirty state, environment blockers, and compiler-agent dependency boundaries are recorded before code edits. |
| SG-1 | Add RealWorld devtools smoke opt-in without changing defaults | SG-0 | high | FR-1, FR-2, NFR-1, NFR-2, NFR-8, AC-1 | Default generated/browser source excludes devtools; smoke mode includes `typed:browser?...&devtools=1` and bridge wiring. |
| SG-2 | Prove shared runtime/bridge truthfulness | SG-1 | high | FR-2, FR-3, FR-4, FR-5, NFR-3, NFR-5, NFR-6, NFR-7, AC-2, AC-3 | Tests prove one runtime/event bus and connected proof has no fixture-backed rows. |
| SG-3 | Prove component tree, DOM links, and source links | SG-2 | high | FR-6, FR-7, FR-8, FR-19, FR-23, FR-24, AC-4, AC-5, AC-6 | RealWorld hydration produces component rows; DOM and source actions resolve to real targets. |
| SG-4 | Prove runtime event lanes: Navigation, HMR, RefSubject, Fx, OTEL | SG-2 | high | FR-9 through FR-18, FR-21 through FR-30, AC-7 through AC-15 | Each lane is live from RealWorld with required production-grade fields. |
| SG-4b | Prove extension artifact, reconnect, and bridge hardening | SG-2, SG-4 | high | FR-31 through FR-35, NFR-15 through NFR-19, AC-16 through AC-18 | Built extension or equivalent panel harness passes connect/reload/replay/no-bridge-negative/fail-closed tests. |
| SG-5 | Finalize reproducible proof documentation and gates | SG-3, SG-4 | medium | FR-20, NFR-11, NFR-12, NFR-13, AC-12, AC-13 | Commands, expected rows, blockers, and verification results are documented; all completed slices are committed. |

## File Ownership Map

| area | files |
| ---- | ----- |
| RealWorld smoke mode | `examples/realworld/src/browser.ts`, `examples/realworld/src/tests/presentation/devtools-smoke-mode.test.ts`, new `examples/realworld/src/tests/devtools/*`, new or modified `examples/realworld/scripts/run-devtools-local.*`, `examples/realworld/package.json` |
| generated browser/runtime opt-in | `packages/app/src/internal/emitBrowserSource.ts`, `packages/app/src/BrowserVirtualModulePlugin.test.ts`, `packages/app/src/runtime/devtoolsBridge.ts`, `packages/app/src/runtime/devtoolsBridge.test.ts`, `packages/app/src/runtime/domTemplateRuntime.ts`, `packages/app/src/runtime/domTemplateRuntime.test.ts` |
| protocol data contracts | `packages/devtools-protocol/src/Schemas.ts`, `packages/devtools-protocol/src/Serialization.ts`, `packages/devtools-protocol/src/Serialization.test.ts`, `packages/devtools-protocol/src/typeInference.test.ts` |
| runtime capture and replay | `packages/devtools-runtime/src/EventBus.ts`, `packages/devtools-runtime/src/EventBus.test.ts`, `packages/devtools-runtime/src/Bridge.ts`, `packages/devtools-runtime/src/Bridge.test.ts`, `packages/devtools-runtime/src/DomRegistry.ts`, `packages/devtools-runtime/src/DomRegistry.test.ts`, `packages/devtools-runtime/src/FxCapture.ts`, `packages/devtools-runtime/src/FxCapture.test.ts`, `packages/devtools-runtime/src/RefSubjectCapture.ts`, `packages/devtools-runtime/src/RefSubjectCapture.test.ts`, `packages/devtools-runtime/src/HmrCapture.ts`, `packages/devtools-runtime/src/HmrCapture.test.ts`, `packages/devtools-runtime/src/NavigationCapture.ts`, `packages/devtools-runtime/src/NavigationCapture.test.ts`, `packages/devtools-runtime/src/OtelCorrelation.ts`, `packages/devtools-runtime/src/OtelCorrelation.test.ts` |
| Chrome panel and extension | `packages/devtools-chrome/src/panel/app.ts`, `packages/devtools-chrome/src/panel/app.test.ts`, `packages/devtools-chrome/src/panel/state.ts`, `packages/devtools-chrome/src/panel/state.test.ts`, `packages/devtools-chrome/src/panel/views/components.ts`, `packages/devtools-chrome/src/panel/views/fx.ts`, `packages/devtools-chrome/src/panel/views/refsubjects.ts`, new view files under `packages/devtools-chrome/src/panel/views/`, `packages/devtools-chrome/src/transport/inspectedWindow.ts`, `packages/devtools-chrome/src/transport/inspectedWindow.test.ts`, `packages/devtools-chrome/src/extensionArtifact.test.ts`, `packages/devtools-chrome/src/devtoolsSmoke.test.ts`, `packages/devtools-chrome/scripts/browser-smoke.mjs`, `packages/devtools-chrome/MANUAL_SMOKE.md` |
| compiler capability dependency checkpoints | `packages/compiler/src/devtools/componentFacts.ts`, `packages/compiler/src/devtools/hmrFacts.ts`, `packages/compiler/src/devtools/sourceAnalyzer.ts`, and their tests; edit only after explicit ownership approval if a proof blocker lands here |
| workflow documentation | `.docs/workflows/20260526-1924-devtools-realworld-proof/plan.md`, `.docs/workflows/20260526-1924-devtools-realworld-proof/memories.md` |

## Ordered Tasks

| task_id | owner | prerequisites | validation | safeguards | rollback |
| ------- | ----- | ------------- | ---------- | ---------- | -------- |
| T0 | direct | approved `plan.md` | `git status --short`; `command -v hurl`; inspect current RealWorld/devtools dirty state | Do not edit unrelated dirty files; record concurrent edits before touching overlapping paths | Revert only this workflow's uncommitted changes if preflight shows ownership conflict. |
| T1 | direct | T0 | failing test showing default RealWorld source excludes devtools while smoke mode should include it | Preserve default RealWorld build path; do not change `typed.config.ts` defaults unless plan is revised | Remove smoke-mode entry/test changes if they affect default build. |
| T2 | direct | T1 | passing generated browser/runtime test for smoke-mode `__TYPED_DEVTOOLS__` bridge and single shared runtime/event bus | Keep devtools opt-in only; use existing app runtime helpers | Back out generated browser/source changes and keep tests documenting blocker. |
| T3 | direct | T2 | panel/transport test proving connected RealWorld mode does not seed fixture runtime rows | Change panel truthfulness before UI polish; no broad visual redesign | Restore prior panel behavior only if test proves live path is not reachable; document blocker. |
| T4 | direct | T2 | RealWorld inspected-window or harness smoke returns `runtime connected` and replay state from page bridge | Prefer inspected-window bridge before full extension automation | Fall back to documented manual Chrome smoke if automation is blocked. |
| T5 | direct with compiler dependency checkpoint | T4 | RealWorld component mount rows include component id, display name, source when available, template hash, DOM binding ids, Fx ids, RefSubject ids, and HMR id | Do not patch broad compiler ownership without explicit approval | If compiler fact blocks resolution, stop and obtain ownership direction before continuing. |
| T6 | direct with compiler dependency checkpoint | T5 | Source action opens/resolves exact RealWorld source resource and line | No browser-only AST approximation | If source bridge missing, task remains failing until source dependency is resolved. |
| T7 | direct | T4 | Real route transition emits Navigation rows with type and destination | Preserve `@typed/navigation` canonical semantics | Remove capture wiring if navigation behavior changes; keep failing semantic test. |
| T8 | direct with compiler dependency checkpoint | T4 | RealWorld HMR local smoke emits separate template optimization and stateful status/reasons | Coordinate with compiler agent on HMR fact gaps | Stop and hand off missing compiler capability instead of inventing panel state. |
| T9 | direct with compiler/runtime dependency checkpoint | T4 | RealWorld RefSubject snapshot and update include id, owner/service identity, value summary, version, subscriber count, timestamp, and bounded history | Serialize/redact values through protocol helpers | Back out observer wiring if it changes RefSubject semantics. |
| T10 | direct with compiler/runtime dependency checkpoint | T4 | RealWorld Fx Graph includes stable ids, labels, owner ids, edges or protocol-backed no-edge reason, phase, timestamp, and last value/error summary | Preserve Fx laziness/interruption/success/failure semantics | Back out capture wiring if semantic-preservation test fails. |
| T11 | direct with trace-source decision | T4 | OTEL row renders RealWorld trace/span identity, parent span when available, timing, status, attributes summary, events/links counts, and Typed correlation id | Preserve OpenTelemetry model; no Typed-only trace replacement | Keep task failing until one RealWorld trace source is implemented. |
| T12 | direct | T7 through T11 | panel has first-class live views for Component Tree, Fx Graph, RefSubject States, HMR, Navigation, OTEL, and Sources | No visual polish before data completeness | Revert view changes if they display partial/fake data as live. |
| T13 | direct | T12 | built extension or equivalent panel harness proves connect, reload, replay, no stale fixture rows, and devtools-disabled no-bridge negative test | Keep Chrome APIs in `@typed/devtools-chrome` | Fall back to manual smoke only as supplement, not production-grade acceptance. |
| T14 | direct | T13 | invalid bridge payloads fail closed and do not crash RealWorld | Validate at protocol boundary | Back out bridge changes if app crash or uncaught exception appears. |
| T15 | direct | T5 through T14 | update `memories.md`; run targeted package tests, RealWorld smoke commands, Chrome/extension smoke, HMR smoke, `git diff --check` | Do not claim blocked gates as passing; name environment blockers | Reopen smallest failed subgoal and revise requirements/spec if acceptance criteria are wrong. |

## Detailed Task Definitions

### T0 - Preflight And Ownership Boundary

- files:
  - create or update: `.docs/workflows/20260526-1924-devtools-realworld-proof/memories.md`
- commands:
  - `git status --short`
  - `command -v hurl`
  - `pnpm --filter @typed/devtools-protocol test`
  - `pnpm --filter @typed/devtools-runtime test`
  - `pnpm --filter @typed/devtools-chrome test`
- expected failing output before fixes:
  - no code failure is required; this task records environment and dirty-state facts.
- pass condition:
  - `memories.md` records current dirty files, missing environment prerequisites, and exact package-test baseline status.

### T1 - RealWorld Devtools Smoke Opt-In

- files:
  - verify unchanged: `examples/realworld/src/browser.ts`
  - create: `examples/realworld/src/browser.devtools.ts`
  - create: `examples/realworld/index.devtools.html`
  - modify: `examples/realworld/src/tests/presentation/devtools-smoke-mode.test.ts`
  - create or modify: `examples/realworld/scripts/run-devtools-local.*`
  - modify: `examples/realworld/package.json`
- failing test:
  - add a test in `devtools-smoke-mode.test.ts` that expects the smoke-mode browser module id to include `typed:browser?routes=./routes&devtools=1`, `index.devtools.html` to load the smoke entry, and the default browser source to stay devtools-free.
- fail command:
  - `pnpm --filter typed-realworld exec vitest run --passWithNoTests src/tests/presentation/devtools-smoke-mode.test.ts`
- expected failure:
  - assertion failure because no explicit smoke-mode entry or script exists yet.
- pass command:
  - same focused Vitest command passes, and `pnpm --filter typed-realworld check` still keeps default devtools disabled.

### T2 - Shared Runtime And Bridge Wiring

- files:
  - modify: `packages/app/src/internal/emitBrowserSource.ts`
  - modify: `packages/app/src/BrowserVirtualModulePlugin.test.ts`
  - modify: `packages/app/src/runtime/devtoolsBridge.ts`
  - modify: `packages/app/src/runtime/devtoolsBridge.test.ts`
  - modify if needed: `packages/app/src/runtime/domTemplateRuntime.ts`
  - modify if needed: `packages/app/src/runtime/domTemplateRuntime.test.ts`
- failing test:
  - add assertions that generated devtools browser source creates exactly one `makeDevtoolsRuntime({ enabled: true })`, passes it to `makeDomRegistry({ runtime: devtoolsRuntime })`, installs the bridge with that same runtime, and replays through that runtime event bus.
- fail command:
  - `pnpm --filter @typed/app test -- BrowserVirtualModulePlugin.test.ts runtime/devtoolsBridge.test.ts runtime/domTemplateRuntime.test.ts`
- expected failure:
  - assertion failure for missing or fragmented shared runtime wiring.
- pass command:
  - same command passes.

### T3 - Connected Panel Must Not Seed Fixture Rows

- files:
  - modify: `packages/devtools-chrome/src/panel/app.ts`
  - modify: `packages/devtools-chrome/src/panel/app.test.ts`
  - modify: `packages/devtools-chrome/src/panel/state.ts`
  - modify: `packages/devtools-chrome/src/panel/state.test.ts`
- failing test:
  - add connected-runtime test where handshake/replay returns no runtime rows and assert Components/Fx/RefSubjects/HMR/Navigation/OTEL are empty, not fixture-populated.
- fail command:
  - `pnpm --filter @typed/devtools-chrome test -- src/panel/app.test.ts src/panel/state.test.ts`
- expected failure:
  - test finds fixture-derived rows or misleading connected state.
- pass command:
  - same command passes.

### T4 - RealWorld Inspected-Window Harness

- files:
  - create: `examples/realworld/src/tests/devtools/devtools-realworld.spec.ts`
  - create or modify: `examples/realworld/scripts/run-devtools-local.*`
  - modify: `examples/realworld/package.json`
- failing test:
  - add Playwright or equivalent browser harness that starts RealWorld smoke mode, evaluates `globalThis.__TYPED_DEVTOOLS__.handshake(...)`, then subscribes to runtime events and asserts `RuntimeReplayState` plus `runtime connected` behavior.
- fail command:
  - `pnpm --filter typed-realworld test:devtools:local`
- expected failure:
  - missing script or bridge global.
- pass command:
  - same command passes and logs inspected page URL plus accepted capabilities.

### T5 - Component Tree And DOM Binding Proof

- files:
  - modify: `packages/devtools-runtime/src/DomRegistry.ts`
  - modify: `packages/devtools-runtime/src/DomRegistry.test.ts`
  - modify: `packages/devtools-chrome/src/panel/views/components.ts`
  - modify: `packages/devtools-chrome/src/panel/app.test.ts`
  - modify: `examples/realworld/src/tests/devtools/devtools-realworld.spec.ts`
- failing test:
  - extend RealWorld harness to assert at least one `ComponentMounted` row with component id, display name, DOM binding id, and template hash when available; assert DOM action resolves that binding.
- commands:
  - `pnpm --filter @typed/devtools-runtime test -- src/DomRegistry.test.ts`
  - `pnpm --filter @typed/devtools-chrome test -- src/panel/app.test.ts`
  - `pnpm --filter typed-realworld test:devtools:local`
- pass condition:
  - all commands pass with live RealWorld component and DOM binding data.

### T6 - Source Deep Links

- files:
  - modify if already owned: `packages/compiler/src/devtools/sourceAnalyzer.ts`
  - modify if already owned: `packages/compiler/src/devtools/sourceAnalyzer.test.ts`
  - modify: `packages/devtools-chrome/src/panel/app.ts`
  - modify: `packages/devtools-chrome/src/panel/app.test.ts`
  - modify: `packages/devtools-chrome/src/sourcesSidebar.ts`
  - modify: `packages/devtools-chrome/src/sourcesSidebar.test.ts`
  - modify: `examples/realworld/src/tests/devtools/devtools-realworld.spec.ts`
- failing test:
  - source action for a RealWorld component opens or resolves a resource under `examples/realworld/src/` with line and column.
- pass commands:
  - `pnpm --filter @typed/devtools-chrome test -- src/panel/app.test.ts src/sourcesSidebar.test.ts`
  - `pnpm --filter typed-realworld test:devtools:local`
- ownership rule:
  - if compiler source facts are missing, do not accept unavailable state as final; ask for ownership to patch compiler facts or wait for the compiler-capability agent.

### T7 - Navigation Lane

- files:
  - modify: `packages/devtools-runtime/src/NavigationCapture.ts`
  - modify: `packages/devtools-runtime/src/NavigationCapture.test.ts`
  - modify: `packages/devtools-chrome/src/panel/app.ts`
  - create: `packages/devtools-chrome/src/panel/views/navigation.ts`
  - modify: `packages/devtools-chrome/src/panel/app.test.ts`
  - modify: `examples/realworld/src/tests/devtools/devtools-realworld.spec.ts`
- failing test:
  - RealWorld route transition emits Navigation row with event id, type, destination, timestamp, and correlation ids when available.
- pass commands:
  - `pnpm --filter @typed/devtools-runtime test -- src/NavigationCapture.test.ts`
  - `pnpm --filter @typed/devtools-chrome test -- src/panel/app.test.ts`
  - `pnpm --filter typed-realworld test:devtools:local`

### T8 - HMR Lane

- files:
  - modify: `packages/devtools-runtime/src/HmrCapture.ts`
  - modify: `packages/devtools-runtime/src/HmrCapture.test.ts`
  - modify: `packages/devtools-chrome/src/panel/app.ts`
  - create: `packages/devtools-chrome/src/panel/views/hmr.ts`
  - modify: `packages/devtools-chrome/src/panel/app.test.ts`
  - modify: `examples/realworld/src/tests/hmr/ui-hmr.spec.ts`
- failing test:
  - RealWorld HMR local smoke shows template optimization separately from stateful-HMR status and structured rejection/eligibility data.
- pass commands:
  - `pnpm --filter @typed/devtools-runtime test -- src/HmrCapture.test.ts`
  - `pnpm --filter @typed/devtools-chrome test -- src/panel/app.test.ts`
  - `pnpm --filter typed-realworld test:hmr:local`

### T9 - RefSubject States

- files:
  - modify: `packages/devtools-protocol/src/Schemas.ts`
  - modify: `packages/devtools-runtime/src/RefSubjectCapture.ts`
  - modify: `packages/devtools-runtime/src/RefSubjectCapture.test.ts`
  - modify: `packages/devtools-chrome/src/panel/views/refsubjects.ts`
  - modify: `packages/devtools-chrome/src/panel/app.test.ts`
  - modify: `examples/realworld/src/tests/devtools/devtools-realworld.spec.ts`
- failing test:
  - RealWorld BrowserAuthState or HMR UI state emits snapshot and update with id, owner/service identity, value summary, version, subscriber count, timestamp, and bounded history.
- pass commands:
  - `pnpm --filter @typed/devtools-protocol test`
  - `pnpm --filter @typed/devtools-runtime test -- src/RefSubjectCapture.test.ts`
  - `pnpm --filter @typed/devtools-chrome test -- src/panel/app.test.ts`
  - `pnpm --filter typed-realworld test:devtools:local`

### T10 - Fx Graph

- files:
  - modify: `packages/devtools-protocol/src/Schemas.ts`
  - modify: `packages/devtools-runtime/src/FxCapture.ts`
  - modify: `packages/devtools-runtime/src/FxCapture.test.ts`
  - modify: `packages/devtools-chrome/src/panel/views/fx.ts`
  - modify: `packages/devtools-chrome/src/panel/app.test.ts`
  - modify: `examples/realworld/src/tests/devtools/devtools-realworld.spec.ts`
- failing test:
  - RealWorld emits an Fx graph with stable ids, labels, owner ids, at least one edge or protocol-backed no-edge reason, phase, timestamp, and last value/error summary.
- pass commands:
  - `pnpm --filter @typed/devtools-protocol test`
  - `pnpm --filter @typed/devtools-runtime test -- src/FxCapture.test.ts`
  - `pnpm --filter @typed/devtools-chrome test -- src/panel/app.test.ts`
  - `pnpm --filter typed-realworld test:devtools:local`

### T11 - OTEL Trace View

- files:
  - modify: `packages/devtools-protocol/src/Schemas.ts`
  - modify: `packages/devtools-runtime/src/OtelCorrelation.ts`
  - modify: `packages/devtools-runtime/src/OtelCorrelation.test.ts`
  - create: `packages/devtools-chrome/src/panel/views/otel.ts`
  - modify: `packages/devtools-chrome/src/panel/app.test.ts`
  - modify: `examples/realworld/src/tests/devtools/devtools-realworld.spec.ts`
- failing test:
  - RealWorld emits at least one trace with trace id, span id, parent span when available, name, timing, status, attributes summary, events/links counts, and Typed correlation id.
- pass commands:
  - `pnpm --filter @typed/devtools-protocol test`
  - `pnpm --filter @typed/devtools-runtime test -- src/OtelCorrelation.test.ts`
  - `pnpm --filter @typed/devtools-chrome test -- src/panel/app.test.ts`
  - `pnpm --filter typed-realworld test:devtools:local`

### T12 - First-Class Panel Views

- files:
  - modify: `packages/devtools-chrome/src/panel/app.ts`
  - modify: `packages/devtools-chrome/src/panel/app.test.ts`
  - modify or create: `packages/devtools-chrome/src/panel/views/components.ts`
  - modify or create: `packages/devtools-chrome/src/panel/views/fx.ts`
  - modify or create: `packages/devtools-chrome/src/panel/views/refsubjects.ts`
  - create if absent: `packages/devtools-chrome/src/panel/views/hmr.ts`
  - create if absent: `packages/devtools-chrome/src/panel/views/navigation.ts`
  - create if absent: `packages/devtools-chrome/src/panel/views/otel.ts`
  - create if absent: `packages/devtools-chrome/src/panel/views/sources.ts`
- failing test:
  - panel test clicks each tab and asserts live rows use RealWorld ids, not fixture ids.
- pass command:
  - `pnpm --filter @typed/devtools-chrome test -- src/panel/app.test.ts`

### T13 - Extension Artifact, Reload, And No-Stale Replay

- files:
  - modify: `packages/devtools-chrome/src/extensionArtifact.test.ts`
  - modify: `packages/devtools-chrome/src/devtoolsSmoke.test.ts`
  - modify: `packages/devtools-chrome/scripts/browser-smoke.mjs`
  - modify: `packages/devtools-chrome/MANUAL_SMOKE.md`
  - modify: `examples/realworld/src/tests/devtools/devtools-realworld.spec.ts`
- failing test:
  - browser smoke loads built extension or equivalent panel harness, connects to RealWorld, reloads page, reconnects, replays fresh state, and proves disabled RealWorld has no bridge.
- pass commands:
  - `pnpm --filter @typed/devtools-chrome build:extension`
  - `pnpm --filter @typed/devtools-chrome test:browser`
  - `pnpm --filter typed-realworld test:devtools:local`

### T14 - Bridge Fail-Closed Hardening

- files:
  - modify: `packages/app/src/runtime/devtoolsBridge.ts`
  - modify: `packages/app/src/runtime/devtoolsBridge.test.ts`
  - modify: `packages/devtools-chrome/src/transport/inspectedWindow.ts`
  - modify: `packages/devtools-chrome/src/transport/inspectedWindow.test.ts`
  - modify: `examples/realworld/src/tests/devtools/devtools-realworld.spec.ts`
- failing test:
  - malformed handshake, subscription, DOM, and source payloads return protocol-shaped unavailable/error responses and do not throw into RealWorld.
- pass commands:
  - `pnpm --filter @typed/app test -- runtime/devtoolsBridge.test.ts`
  - `pnpm --filter @typed/devtools-chrome test -- src/transport/inspectedWindow.test.ts`
  - `pnpm --filter typed-realworld test:devtools:local`

### T15 - Final Verification And Memory

- files:
  - modify: `.docs/workflows/20260526-1924-devtools-realworld-proof/memories.md`
  - modify: `.docs/workflows/20260526-1924-devtools-realworld-proof/plan.md`
- commands:
  - `pnpm --filter @typed/devtools-protocol test`
  - `pnpm --filter @typed/devtools-runtime test`
  - `pnpm --filter @typed/devtools-chrome test`
  - `pnpm --filter @typed/app test`
  - `pnpm --filter typed-realworld check`
  - `pnpm --filter typed-realworld test:devtools:local`
  - `pnpm --filter typed-realworld test:hmr:local`
  - `pnpm --filter @typed/devtools-chrome build:extension`
  - `pnpm --filter @typed/devtools-chrome test:browser`
  - `git diff --check`
- pass condition:
  - all commands pass or environment-only blockers are named with exact failing command, exact error, and no production-grade success claim.

## Milestone Sequencing

1. M0 - Preflight and ownership:
   - Complete T0.
   - Outcome: know whether implementation can touch RealWorld/app/devtools files without conflicting with concurrent edits.

2. M1 - RealWorld opt-in and bridge:
   - Complete T1 and T2.
   - Outcome: smoke-mode RealWorld generated runtime can expose the bridge while defaults stay clean.

3. M2 - Live panel/transport truthfulness:
   - Complete T3 and T4.
   - Outcome: connected proof path reads RealWorld runtime data and does not use fixture rows as proof.

4. M3 - Component, DOM, and source proof:
   - Complete T5 and T6.
   - Outcome: component tree, DOM deep links, and source deep links are live against RealWorld.

5. M4 - Runtime event lanes:
   - Complete T7 through T12.
   - Outcome: Navigation, HMR, RefSubject, Fx, OTEL, and all panel views are live with production-grade fields.

6. M5 - Extension/reconnect/hardening:
   - Complete T13 and T14.
   - Outcome: built extension or equivalent harness proves connect/reload/replay/no-bridge/fail-closed behavior.

7. M6 - Verification and memory:
   - Complete T15.
   - Outcome: commands, blockers, memory, and validated commits are ready for finalization.

## Tactical Replanning Triggers

- A test shows default RealWorld builds now include devtools.
- A bridge or panel proof uses fixtures while reporting `runtime connected`.
- A runtime instrumentation change alters Fx, RefSubject, Router, Layer, or HMR behavior.
- A capability gap is compiler-owned and cannot be fixed narrowly in app/runtime/panel code.
- Chrome extension automation cannot run locally.
- `hurl` or another local prerequisite blocks RealWorld acceptance.
- Concurrent dirty edits overlap a task's intended write set.

When triggered, replan only the affected task/subgoal unless the objective or approved scope changes.

## Mutating-Action Safeguards

- Before each Phase 4 task, update this plan with a task-specific red/green plan.
- Write the failing test first, verify it fails, then implement the smallest code change.
- Stage and commit only files owned by the completed task.
- Use `git diff --check` before every commit.
- Do not revert files changed by other agents or the human.
- Ask before patching broad compiler capability gaps.
- Do not mark a capability complete because a blocker is documented; blockers require replanning or explicit scope change.

## Phase 4 Task Update Rule

The detailed task definitions above are the execution baseline. Before starting each Phase 4 task, update that task section only when live preflight discovers a different exact test name, file path, or command. Any such update must preserve the same requirement links, failing-test-first order, passing command, rollback rule, and commit scope.

## Memory Plan

- capture:
  - exact RealWorld devtools smoke command;
  - exact Chrome/inspected-window proof steps;
  - environment blockers such as `hurl`;
  - compiler dependency facts with missing ids/events;
  - verified tests and commands per task.
- promotion_criteria:
  - fact is verified by a passing command or reproducible blocker;
  - fact applies beyond this one workflow;
  - fact does not depend on uncommitted dirty workspace state.
- recall_targets:
  - `.docs/specs/typed-devtools/spec.md`;
  - `.docs/specs/typed-devtools/testing-strategy.md`;
  - `.docs/adrs/20260523-1703-typed-devtools-protocol-boundaries.md`;
  - `.docs/workflows/20260524-1047-cohesion-remediation-plan/developer-tooling-handoff.md`.

## Approval Gate

Does `plan.md` look good?

- `LGTM`
- `Needs sequencing/ownership revisions`
- `Needs validation/safeguard/rollback revisions`
- `Other: <custom feedback>`
