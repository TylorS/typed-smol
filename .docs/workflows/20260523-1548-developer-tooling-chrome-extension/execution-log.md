## Execution Summary

- workflow_slug: 20260523-1548-developer-tooling-chrome-extension
- mode: strict
- finalization_strategy: merge
- current_scope: execute approved plan task T25, then report task completion.

## Dependency Readiness Matrix

| dependency       | readiness | evidence                                                                            |
| ---------------- | --------- | ----------------------------------------------------------------------------------- |
| Intent and scope | ready     | Approved and committed in `2f6fb78`.                                                |
| Requirements     | ready     | Approved and committed in `201105f`.                                                |
| Specification    | ready     | Approved and committed in `b69f8f0`.                                                |
| Plan             | ready     | Approved and committed in `cad5b8e`; duplicate hook cleanup committed in `4a29818`. |
| Subagent review  | active    | T1 sidecar review requested before protocol package commit.                         |

## Task Records

### T1 - Protocol Package and Branded Ids

- task_id: T1
- requirement_ids: FR-1, FR-2, FR-41, FR-42, FR-43, FR-44, FR-45, NFR-1, NFR-2, NFR-15, NFR-16, NFR-17, NFR-18, AC-1, AC-13, AC-14
- ts_scenarios: TS-1, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-protocol exec vitest run src/Ids.test.ts` failed with `Cannot find module './Ids.js'`.
  - review: Sidecar review found missing typecheck proof, non-canonical parser acceptance, missing `pnpm-lock.yaml` importer, and missing `scripts/publish-beta.sh` entry.
  - green: `pnpm --filter @typed/devtools-protocol test` passed with typecheck plus 1 Vitest file and 7 tests.
  - green: `pnpm --filter @typed/devtools-protocol build` passed.
  - green: protocol boundary grep returned no Chrome/runtime/fx/template/navigation imports.
  - green: `git diff --check -- packages/devtools-protocol scripts/publish-beta.sh pnpm-lock.yaml .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
- commit:
  - `1286c6e feat(devtools): add protocol package`
- deviations_or_replans:
  - Expanded T1 write set to include `tsconfig.test.json`, `pnpm-lock.yaml`, and `scripts/publish-beta.sh` after subagent review found typecheck, lockfile, and publish-order gaps for a real package.
- context_updates:
  - Added active T1 detail to `plan.md`.
  - Added `@typed/devtools-protocol` package shell and host-neutral id surface.
  - Added beta publish order and lockfile wiring for the new package.
- memory_updates:
  - Branded protocol ids are plain strings at runtime and centralized in `@typed/devtools-protocol`.

### T2 - Protocol Schemas and Serialization

- task_id: T2
- requirement_ids: FR-1, FR-2, FR-24, FR-41, FR-42, NFR-2, NFR-6, NFR-15, NFR-16, NFR-17, AC-1, AC-5, AC-13
- ts_scenarios: TS-1, TS-5, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-protocol exec vitest run src/Serialization.test.ts src/typeInference.test.ts` failed with missing `./Schemas.js` and `./Serialization.js`.
  - red: after self-review found missing HMR fact coverage, `pnpm --filter @typed/devtools-protocol exec vitest run src/Serialization.test.ts` failed with `Cannot read properties of undefined (reading 'ast')` for `HmrStatusFactSchema`.
  - green: focused `Serialization.test.ts` and `typeInference.test.ts` passed after schemas and serialization implementation.
  - green: focused `Serialization.test.ts` passed after adding the host-neutral HMR status fact schema.
  - green: `pnpm --filter @typed/devtools-protocol test` passed with typecheck plus 3 Vitest files and 21 tests.
  - green: `pnpm --filter @typed/devtools-protocol build` passed.
  - green: host-neutral import/dependency grep returned no matches.
  - green: `pnpm exec oxlint packages/devtools-protocol/src` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-protocol/src/Ids.ts packages/devtools-protocol/src/Schemas.ts packages/devtools-protocol/src/Serialization.ts packages/devtools-protocol/src/Serialization.test.ts packages/devtools-protocol/src/typeInference.test.ts packages/devtools-protocol/src/index.ts` passed.
  - green: `git diff --check -- packages/devtools-protocol .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found non-finite numeric decode, unbranded OTEL correlation ids, and accessor redaction hazards.
  - green: after review fixes, `pnpm --filter @typed/devtools-protocol test` passed with typecheck plus 3 Vitest files and 21 tests.
  - green: after review fixes, `pnpm --filter @typed/devtools-protocol build` passed.
  - green: after review fixes, host-neutral import/dependency grep and scoped `git diff --check` passed.
- commit:
  - `22606d0 feat(devtools): add protocol schemas and serialization`
- deviations_or_replans:
  - Added `Ids.ts` to the T2 write set to quiet an `oxlint` control-regex warning discovered during protocol package lint verification.
  - Ran sidecar subagent review because the user explicitly requested subagents and frequent review.
- context_updates:
  - Added active T2 detail to `plan.md`.
  - Added protocol schemas for ids, capabilities, handshake, runtime events, DOM binding, HMR status facts, and source Analyzer requests/results.
  - Added bounded serialized value schema, finite-number codecs, strict decode helper, and redaction/size/cycle handling.
  - Added accessor-safe object serialization and typed OTEL correlation ids.
- memory_updates:
  - Use protocol decode helpers with `onExcessProperty: "error"` at cross-boundary decode sites.
  - HMR protocol facts keep template optimization separate from stateful-HMR eligibility or rejection reasons.
  - Redacted accessor properties must not invoke getters during serialization.
  - OTEL Typed correlation ids must use branded Typed id schemas, not raw strings.

## Deferred Work

### T3 - Protocol RPC Group and Fixtures

- task_id: T3
- requirement_ids: FR-1, FR-2, FR-40, FR-43, FR-44, FR-45, NFR-1, NFR-17, NFR-18, AC-1, AC-11, AC-14
- ts_scenarios: TS-1, TS-12
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-protocol exec vitest run src/Rpc.test.ts` failed with missing `./Fixtures.js`.
  - green: `pnpm --filter @typed/devtools-protocol exec vitest run src/Rpc.test.ts` passed with 3 tests.
  - green: `pnpm --filter @typed/devtools-protocol test` passed with typecheck plus 4 Vitest files and 24 tests.
  - green: `pnpm --filter @typed/devtools-protocol build` passed.
  - green: `pnpm exec oxlint packages/devtools-protocol/src` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check ...` passed for protocol package source files.
  - green: host-neutral import/dependency grep returned no matches.
  - green: `git diff --check -- packages/devtools-protocol .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found no blocking findings for pinned `effect/unstable/rpc` usage or fixture shape reuse.
- commit:
  - `cd404a1 feat(devtools): add protocol rpc group`
- deviations_or_replans:
  - none
- context_updates:
  - Added active T3 detail to `plan.md`.
  - Added `TypedDevtoolsRpcGroup` with Handshake, SubscribeRuntimeEvents, ResolveDomBinding, and AnalyzeSource.
  - Added host-neutral protocol fixtures and in-process `RpcTest` coverage.
- memory_updates:
  - Keep direct `effect/unstable/rpc` usage inside `packages/devtools-protocol/src/Rpc.ts`.
  - `RpcTest.makeClient` plus `RpcGroup.toLayer` is the pinned Effect beta path for in-process protocol verification.

## Deferred Work

### T4 - Compiler Component DevTools Facts

- task_id: T4
- requirement_ids: FR-12, FR-17, FR-41, FR-42, NFR-7, NFR-15, NFR-17, AC-3, AC-13
- ts_scenarios: TS-3, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/compiler exec vitest run src/devtools/componentFacts.test.ts` failed because `@typed/devtools-protocol` was not yet wired into the compiler package.
  - red: after sidecar review, the focused test failed on fallback RefSubject id collision (`ref:count` instead of component-scoped id).
  - green: `pnpm --filter @typed/compiler exec vitest run src/devtools/componentFacts.test.ts` passed with 4 tests.
  - green: `pnpm --filter @typed/compiler build` passed.
  - green: `pnpm exec oxlint packages/compiler/src/devtools/componentFacts.ts packages/compiler/src/devtools/componentFacts.test.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/compiler/src/devtools/componentFacts.ts packages/compiler/src/devtools/componentFacts.test.ts` passed.
  - green: compiler devtools boundary grep for `effect/unstable/rpc` and `chrome.` returned no matches.
  - green: `git diff --check -- packages/compiler pnpm-lock.yaml .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: First sidecar review found the rich-fact/protocol-summary mismatch and runtime anchor-path concern; both were addressed before the green run.
  - review: Second sidecar review found fallback RefSubject id collisions, sparse part id/source gaps, and staged-index hygiene risk; all implementation blockers except surgical staging were fixed before the green run.
  - review: Final scoped sidecar review found no blockers after the sparse/refsubject/protocol-summary fixes.
- commit:
  - `bbbe8df feat(devtools): add compiler component facts`
- deviations_or_replans:
  - Expanded T4 write set to include compiler package dependency, tsconfig project reference, and lockfile so compiler can consume `@typed/devtools-protocol` as the protocol source of truth.
  - `packages/compiler/src/index.ts` has unrelated concurrent route export changes; stage only the devtools export for this task.
- context_updates:
  - Added active T4 detail to `plan.md`.
  - Added `createComponentDevtoolsFact(s)` for compiler-local rich component/template facts plus protocol-safe `summary`.
  - Added compiler dependency and project reference to `@typed/devtools-protocol`.
- memory_updates:
  - Component DevTools facts should expose a protocol-safe `summary` and keep richer compiler-only template/source fields outside `ComponentSummary`.
  - Template `node` part ids should use the effective runtime anchor path, matching `transformTemplateModule` behavior.
  - Fallback RefSubject ids must be scoped by `moduleId#exportName#localName`; only explicit ids or service ids may stand alone.
  - Sparse template parts need stable ids that include kind/name/path/value indexes, and should retain expression source spans when compiler analysis provides them.

### T5 - Compiler HMR DevTools Facts

- task_id: T5
- requirement_ids: FR-17, FR-25, FR-26, FR-41, FR-42, NFR-15, NFR-17, AC-6, AC-13
- ts_scenarios: TS-6, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/compiler exec vitest run src/devtools/hmrFacts.test.ts` failed with missing `./hmrFacts.js`.
  - green: `pnpm --filter @typed/compiler exec vitest run src/devtools/hmrFacts.test.ts` passed with 6 tests.
  - green: `pnpm --filter @typed/compiler build` passed.
  - green: `pnpm exec oxlint packages/compiler/src/devtools/hmrFacts.ts packages/compiler/src/devtools/hmrFacts.test.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/compiler/src/devtools/hmrFacts.ts packages/compiler/src/devtools/hmrFacts.test.ts` passed.
  - green: compiler devtools boundary grep for `effect/unstable/rpc` and `chrome.` returned no matches.
  - green: `git diff --check -- packages/compiler .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found staged-index hygiene risk plus non-blocking gaps around canonical service ordering, dependency rejection coverage, and unknown route status; implementation/test gaps were resolved before commit, and `index.ts` will be staged surgically.
- commit:
  - `f2055c3 feat(devtools): add compiler hmr facts`
- deviations_or_replans:
  - none
- context_updates:
  - Added active T5 detail to `plan.md`.
  - Added `createHmrStatusFacts` to adapt compiler compile capability output into protocol `HmrStatusFact` values.
- memory_updates:
  - HMR DevTools facts should sort service ids by compiler module id and service id for deterministic payloads.
  - Route components with no inferred HMR services and no explicit rejection remain `Unknown`, not `Rejected`.

### T6 - Compiler Source Analyzer Planning

- task_id: T6
- requirement_ids: FR-32, FR-33, FR-34, FR-35, FR-36, FR-37, FR-41, FR-42, NFR-8, NFR-14, NFR-15, NFR-17, AC-10, AC-11, AC-13
- ts_scenarios: TS-10, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts` failed with missing `./sourceAnalyzer.js`.
  - green: `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts` passed with 5 tests.
  - green: `pnpm --filter @typed/compiler build` passed.
  - green: `pnpm exec oxlint packages/compiler/src/devtools/sourceAnalyzer.ts packages/compiler/src/devtools/sourceAnalyzer.test.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/compiler/src/devtools/sourceAnalyzer.ts packages/compiler/src/devtools/sourceAnalyzer.test.ts` passed.
  - green: compiler devtools boundary grep for `effect/unstable/rpc` and `chrome.` returned no matches.
  - green: `git diff --check -- packages/compiler .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found position-base ambiguity, first-text-match source spans, duplicate route analysis, and staged-index hygiene risk; implementation/test gaps were fixed, and final scoped review found no blockers.
- commit:
  - `9d6b0bd feat(devtools): add compiler source analyzer planning`
- deviations_or_replans:
  - none
- context_updates:
  - Added active T6 detail to `plan.md`.
  - Added `planSourceAnalyzerResponse` for protocol request/response planning over compiler artifacts.
- memory_updates:
  - Source Analyzer request/range positions default to zero-based DevTools coordinates; one-based compiler/editor positions require an explicit planner option.
  - RefSubject and Fx source Analyzer facts should use TypeScript declaration name spans, not text search over source content.

### T7 - DevTools Runtime Layer Package

- task_id: T7
- requirement_ids: FR-3, FR-5, FR-8, FR-9, FR-10, FR-18, FR-38, FR-39, FR-41, FR-42, NFR-3, NFR-4, NFR-5, NFR-13, NFR-15, NFR-17, AC-2, AC-13
- ts_scenarios: TS-2, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-runtime test` failed before implementation with missing runtime/protocol/effect modules and missing `./Layer.js`.
  - green: `pnpm --filter @typed/devtools-runtime test` passed with typecheck and 5 Vitest tests.
  - green: `pnpm --filter @typed/devtools-runtime build` passed.
  - green: `pnpm exec oxlint packages/devtools-runtime/src` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-runtime/src/Layer.ts packages/devtools-runtime/src/Layer.test.ts packages/devtools-runtime/src/index.ts` passed.
  - green: runtime package boundary grep for `chrome.` and `effect/unstable/rpc` returned no matches.
  - green: `git diff --check -- packages/devtools-runtime pnpm-lock.yaml scripts/publish-beta.sh .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found mutable snapshot and weak disabled-default proof; both were fixed with a no-op disabled service, cloned snapshots, and focused regression tests.
- commit:
  - `eff5fcc feat(devtools): add runtime layer package`
- deviations_or_replans:
  - Expanded T7 write set to include `tsconfig.test.json`, `pnpm-lock.yaml`, and `scripts/publish-beta.sh` for workspace/test/publish wiring.
- context_updates:
  - Added active T7 detail to `plan.md`.
  - Added `@typed/devtools-runtime` package with explicit `DevtoolsRuntime` Effect service and `DevtoolsRuntimeLayer` constructor.
- memory_updates:
  - Disabled runtime services should be a distinct no-op path, not an enabled-style collector with a guard.
  - Runtime event history snapshots should clone protocol events on emit and on read so caller-owned objects cannot mutate captured history.

### T8 - App DevTools Config Wiring

- task_id: T8
- requirement_ids: FR-3, FR-5, FR-8, FR-9, FR-10, FR-18, FR-38, FR-39, FR-41, FR-42, NFR-3, NFR-4, NFR-5, NFR-13, NFR-15, NFR-17, AC-2, AC-13
- ts_scenarios: TS-2, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/app exec vitest run src/devtoolsConfig.test.ts` failed before app dependency/runtime helper wiring with missing `@typed/devtools-runtime`.
  - red: after config helper implementation, `pnpm --filter @typed/app exec vitest run src/devtoolsConfig.test.ts` failed because object-form config with only `sessionId` still produced `session:inactive`.
  - green: `pnpm --filter @typed/app exec vitest run src/devtoolsConfig.test.ts` passed with 4 tests and no type errors.
  - green: `pnpm --filter @typed/app build` passed.
  - green: `pnpm exec oxlint packages/app/src/devtoolsConfig.test.ts packages/app/src/runtime/devtools.ts packages/app/src/config/TypedConfig.ts packages/app/src/config/index.ts packages/app/src/runtime/index.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/app/src/devtoolsConfig.test.ts packages/app/src/runtime/devtools.ts packages/app/src/config/TypedConfig.ts packages/app/src/config/index.ts packages/app/src/runtime/index.ts` passed.
  - green: app boundary grep for `effect/unstable/rpc` and `chrome.` returned no matches.
  - green: `git diff --check -- packages/app pnpm-lock.yaml .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found no blockers and called out staged-index hygiene risks in shared config files; both were handled with partial staging.
- commit:
  - `dcd0c05 feat(devtools): add app config wiring`
- deviations_or_replans:
  - Expanded T8 write set to include `packages/app/package.json`, `packages/app/src/config/index.ts`, `packages/app/src/runtime/devtools.ts`, and `pnpm-lock.yaml` so the app can depend on the explicit runtime Layer package.
  - `packages/app/src/config/TypedConfig.ts` and `packages/app/src/config/index.ts` have unrelated concurrent config additions; stage only DevTools-owned hunks for this task.
- context_updates:
  - Added active T8 detail to `plan.md`.
  - Added app config opt-in resolution and explicit `DevtoolsRuntimeLayer` construction helper.
- memory_updates:
  - Object-form devtools config remains disabled unless `enabled: true`; a `sessionId` alone is not an opt-in.

### T9 - Runtime EventBus and Protocol Bridge

- task_id: T9
- requirement_ids: FR-3, FR-5, FR-8, FR-9, FR-10, FR-18, FR-38, FR-39, FR-41, FR-42, FR-43, FR-44, FR-45, NFR-3, NFR-4, NFR-5, NFR-13, NFR-15, NFR-17, NFR-18, AC-2, AC-13, AC-14
- ts_scenarios: TS-2, TS-12
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-runtime exec vitest run src/EventBus.test.ts src/Bridge.test.ts` failed with missing `./EventBus.js` and `./Bridge.js`.
  - red: after initial EventBus/Bridge implementation, `pnpm --filter @typed/devtools-runtime exec vitest run src/Bridge.test.ts` failed because events emitted through `DevtoolsRuntimeService` were not visible to the bridge event bus.
  - red: sidecar review regressions failed before fixes because protocol requests rejected `sinceSequence`, the bridge omitted replay state from streamed items, bridge-advertised session mismatch was not enforced, and EventBus replay still used timestamps.
  - green: `pnpm --filter @typed/devtools-protocol exec vitest run src/Serialization.test.ts src/Rpc.test.ts` passed with 15 tests.
  - green: `pnpm --filter @typed/devtools-protocol test` passed with typecheck plus 4 Vitest files and 25 tests.
  - green: `pnpm --filter @typed/devtools-protocol build` passed.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/EventBus.test.ts src/Bridge.test.ts src/Layer.test.ts` passed with 16 tests.
  - green: after review fixes, `pnpm --filter @typed/devtools-runtime exec vitest run src/EventBus.test.ts src/Bridge.test.ts src/Layer.test.ts` passed with 19 tests.
  - green: `pnpm --filter @typed/devtools-runtime test` passed with typecheck plus 3 Vitest files and 19 tests.
  - review: Second sidecar review found custom EventBus session-consistency gaps in runtime and bridge construction.
  - red: custom EventBus session regression tests failed before fixes because runtime service and bridge did not enforce `sessionId` consistently.
  - green: after session-consistency fixes, `pnpm --filter @typed/devtools-runtime exec vitest run src/EventBus.test.ts src/Bridge.test.ts src/Layer.test.ts` passed with 21 tests.
  - green: after session-consistency fixes, `pnpm --filter @typed/devtools-runtime test` passed with typecheck plus 3 Vitest files and 21 tests.
  - green: `pnpm --filter @typed/devtools-runtime build` passed.
  - green: `pnpm exec oxlint packages/devtools-protocol/src packages/devtools-runtime/src` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-protocol/src/Schemas.ts packages/devtools-protocol/src/Rpc.ts packages/devtools-protocol/src/Fixtures.ts packages/devtools-protocol/src/Rpc.test.ts packages/devtools-protocol/src/Serialization.test.ts packages/devtools-runtime/src/EventBus.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/Layer.ts packages/devtools-runtime/src/Layer.test.ts packages/devtools-runtime/src/index.ts` passed.
  - green: runtime package boundary grep for `chrome.` and `effect/unstable/rpc` returned no matches.
  - green: `git diff --check -- packages/devtools-protocol packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
- commit:
  - `21348e5 feat(devtools): add runtime event bridge`
- deviations_or_replans:
  - Expanded T9 write set to include `Layer.ts` and `Layer.test.ts` so `DevtoolsRuntimeService.emit` and bridge subscriptions share the same EventBus.
  - Expanded T9 write set to include protocol schemas/RPC/fixtures because replay state has to cross the shared RPC boundary to satisfy reconnect semantics.
- context_updates:
  - Added protocol-owned `RuntimeReplayState` and `RuntimeEventStreamItem` for sequence-based replay metadata.
  - Added bounded `RuntimeEventBus` with clone-on-write protocol decoding, capability-filtered sequence replay, and explicit disabled/ready/partial/session-mismatch replay state.
  - Added bridge facade and protocol-owned `TypedDevtoolsRpcGroup.of` handlers for handshake, runtime event subscription, DOM binding resolution, and source analysis.
- memory_updates:
  - The bridge must consume the same EventBus as `DevtoolsRuntimeService.emit`; separate runtime and bridge stores make later Fx/RefSubject instrumentation invisible to DevTools.
  - Custom EventBus injection must enforce one consistent session across runtime service, bridge, and bus.

### T10 - Template DOM DevTools Hook Points

- task_id: T10
- requirement_ids: FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-41, FR-42, NFR-7, NFR-15, NFR-17, AC-3, AC-13
- ts_scenarios: TS-3, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/template exec vitest run src/compiler-runtime/devtools.test.ts src/compiler-runtime/dom.test.ts` failed with missing `./devtools.js`; existing `dom.test.ts` passed.
  - red: sidecar review regressions failed before fixes because binding notifications were eager and observer throws changed render behavior.
  - red: compiler table-driven fixture failed before fixes because large template event/ref entries emitted invalid metadata.
  - green: `pnpm --filter @typed/template exec vitest run src/compiler-runtime/devtools.test.ts src/compiler-runtime/dom.test.ts` passed with 9 tests.
  - green: `pnpm --filter @typed/compiler exec vitest run src/template/transformTemplateModule.test.ts` passed with 13 tests.
  - green: `pnpm --filter @typed/template build` passed.
  - green: `pnpm --filter @typed/compiler build` passed.
  - green: `pnpm exec oxlint packages/template/src/compiler-runtime/devtools.ts packages/template/src/compiler-runtime/devtools.test.ts packages/template/src/compiler-runtime/dom.ts packages/template/src/compiler-runtime/dom.test.ts packages/template/src/compiler-runtime/renderable.ts packages/compiler/src/template/transformTemplateModule.ts packages/compiler/src/template/transformTemplateModule.test.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/template/src/compiler-runtime/devtools.ts packages/template/src/compiler-runtime/devtools.test.ts packages/template/src/compiler-runtime/dom.ts packages/template/src/compiler-runtime/dom.test.ts packages/template/src/compiler-runtime/renderable.ts packages/compiler/src/template/transformTemplateModule.ts packages/compiler/src/template/transformTemplateModule.test.ts` passed.
  - green: template/compiler boundary grep for `chrome.` and `effect/unstable/rpc` returned no matches.
  - green: `git diff --check -- packages/template packages/compiler/src/template/transformTemplateModule.ts packages/compiler/src/template/transformTemplateModule.test.ts .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found eager hook notification, invalid table-driven event/ref metadata, and missing workflow evidence; implementation gaps were fixed before commit.
- commit:
  - `b186294 feat(devtools): add template dom hooks`
- deviations_or_replans:
  - Expanded T10 write set to include `packages/compiler/src/template/transformTemplateModule.ts` and `transformTemplateModule.test.ts` because the compiler table emitter must generate valid metadata consumed by `mountDomTemplateBindings`.
- context_updates:
  - Added host-neutral DOM template DevTools observer hooks for binding, mount, and unmount metadata.
  - Added lazy, diagnostic-only binding notifications that do not change template render semantics when observers throw.
  - Fixed table-driven compiler metadata for large template `event` and `ref` parts.
- memory_updates:
  - DOM template DevTools hooks must be lazy inside the returned mount Effect; construction must not fire observer callbacks.
  - DevTools observer failures are swallowed because instrumentation is diagnostic-only.
  - Compiler table-driven DOM bindings must keep `event` and `ref` entries structurally aligned with `DomTemplateBinding`.

### T11 - Runtime DOM Registry

- task_id: T11
- requirement_ids: FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-18, FR-39, FR-41, FR-42, NFR-7, NFR-15, NFR-17, AC-3, AC-13
- ts_scenarios: TS-3, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-runtime exec vitest run src/DomRegistry.test.ts` failed with missing `./DomRegistry.js`.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/DomRegistry.test.ts` passed with 5 tests.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/DomRegistry.test.ts src/Bridge.test.ts` passed with 14 tests.
  - green: `pnpm --filter @typed/devtools-runtime build` passed.
  - green: `pnpm exec oxlint packages/devtools-runtime/src/DomRegistry.ts packages/devtools-runtime/src/DomRegistry.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed with 0 warnings and 0 errors.
  - red: `pnpm exec oxfmt --check packages/devtools-runtime/src/DomRegistry.ts packages/devtools-runtime/src/DomRegistry.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` found format issues in the two new DOM registry files.
  - green: after formatting, `pnpm --filter @typed/devtools-runtime exec vitest run src/DomRegistry.test.ts src/Bridge.test.ts` passed with 14 tests.
  - green: after formatting, `pnpm --filter @typed/devtools-runtime build` passed.
  - green: after formatting, `pnpm exec oxlint packages/devtools-runtime/src/DomRegistry.ts packages/devtools-runtime/src/DomRegistry.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed with 0 warnings and 0 errors.
  - green: after formatting, `pnpm exec oxfmt --check packages/devtools-runtime/src/DomRegistry.ts packages/devtools-runtime/src/DomRegistry.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed.
  - green: boundary grep for `chrome.` and `effect/unstable/rpc` returned no matches.
  - green: `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found a blocking non-canonical `templatePartId` mapping and a same-template pending-binding ownership race.
  - red: review regression tests failed before fixes because the registry used runtime binding ids as `templatePartId` values and assigned all same-template pending bindings to the first mounted root.
  - green: after review fixes, `pnpm --filter @typed/devtools-runtime exec vitest run src/DomRegistry.test.ts` passed with 6 tests.
  - green: after review fixes, `pnpm --filter @typed/devtools-runtime exec vitest run src/DomRegistry.test.ts src/Bridge.test.ts` passed with 15 tests.
  - green: after review fixes and formatting, `pnpm --filter @typed/devtools-runtime build` passed.
  - green: after review fixes and formatting, `pnpm exec oxlint packages/devtools-runtime/src/DomRegistry.ts packages/devtools-runtime/src/DomRegistry.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed with 0 warnings and 0 errors.
  - green: after review fixes and formatting, `pnpm exec oxfmt --check packages/devtools-runtime/src/DomRegistry.ts packages/devtools-runtime/src/DomRegistry.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed.
  - green: after review fixes and formatting, boundary grep for `chrome.` and `effect/unstable/rpc` returned no matches.
  - green: after review fixes and formatting, `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
- commit:
  - `1f79752 feat(devtools): add runtime dom registry`
- context_updates:
  - Added `makeDomRegistry` with a template observer, node lookup, protocol binding lookup, component registration, and bridge-compatible resolver.
  - Added nearest-owner DOM node resolution for comment anchors, fragment roots, nested mounts, and unbound nodes.
- memory_updates:
  - DOM registry root ownership should be stored through `WeakMap<Node, DomNodeRecord>` and resolved by walking parent nodes to find the nearest registered owner.
  - Runtime DOM registry template part ids must match compiler fact ids: `templateHash#runtimePath#valueIndex`.
  - Same-template pending binding ownership must be assigned by actual mounted node ancestry, not by template hash alone.

### T12 - RefSubject DevTools Hooks

- task_id: T12
- requirement_ids: FR-18, FR-19, FR-23, FR-24, FR-41, FR-42, NFR-3, NFR-4, NFR-6, NFR-15, NFR-17, AC-4, AC-5, AC-13
- ts_scenarios: TS-4, TS-5, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/fx exec vitest run src/RefSubject.devtools.test.ts src/RefSubject.test.ts` failed before implementation because RefSubject emitted no DevTools snapshot/update events.
  - red: after initial implementation, `pnpm --filter @typed/fx exec vitest run src/RefSubject.devtools.test.ts src/RefSubject.test.ts` failed with `TypeError: zipRight is not a function`.
  - red: after replacing `Effect.zipRight`, the focused test failed because the first captured value emitted as `Updated` with version `-1` instead of `Snapshot` version `0`.
  - green: `pnpm --filter @typed/fx exec vitest run src/RefSubject.devtools.test.ts src/RefSubject.test.ts` passed with 2 test files and 9 tests.
  - green: `pnpm --filter @typed/fx build` passed.
  - green: `pnpm exec oxlint packages/fx/src/RefSubject/devtools.ts packages/fx/src/RefSubject.devtools.test.ts packages/fx/src/RefSubject/RefSubject.ts packages/fx/src/RefSubject/index.ts packages/fx/src/index.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/fx/src/RefSubject/devtools.ts packages/fx/src/RefSubject.devtools.test.ts packages/fx/src/RefSubject/RefSubject.ts packages/fx/src/RefSubject/index.ts packages/fx/src/index.ts` passed.
  - green: boundary grep for `chrome.`, `effect/unstable/rpc`, and `@typed/devtools-protocol` returned no matches.
  - green: `git diff --check -- packages/fx .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found no Critical, Important, or blocking Minor issues.
- commit:
  - `23ec78c feat(devtools): add refsubject devtools hooks`
- context_updates:
  - Added host-neutral RefSubject DevTools observer types for snapshot/update events.
  - Added optional `RefSubjectOptions.devtools` metadata and diagnostic-only observer notifications for successful value changes.
  - Propagated `RefSubject.Service(...).make` ids into emitted DevTools metadata.
- memory_updates:
  - RefSubject DevTools event types should be discriminated unions so snapshot and update observers narrow without casts.
  - Initial RefSubject DevTools notification can observe the `DeferredRef` wakeup before the public version increments; normalize the captured first event in the instrumentation layer rather than changing `DeferredRef`.

### T13 - Runtime RefSubject Capture

- task_id: T13
- requirement_ids: FR-18, FR-19, FR-23, FR-24, FR-41, FR-42, NFR-3, NFR-4, NFR-6, NFR-15, NFR-17, AC-4, AC-5, AC-13
- ts_scenarios: TS-5, TS-11
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-runtime exec vitest run src/RefSubjectCapture.test.ts` failed before implementation with missing `./RefSubjectCapture.js`.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/RefSubjectCapture.test.ts` passed with 1 test file and 4 tests.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/RefSubjectCapture.test.ts src/EventBus.test.ts src/Bridge.test.ts` passed with 3 test files and 19 tests.
  - green: `pnpm --filter @typed/devtools-runtime build` passed.
  - green: `pnpm exec oxlint packages/devtools-runtime/src/RefSubjectCapture.ts packages/devtools-runtime/src/RefSubjectCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-runtime/src/RefSubjectCapture.ts packages/devtools-runtime/src/RefSubjectCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed.
  - green: boundary grep for `chrome.` and `effect/unstable/rpc` returned no matches.
  - green: `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found no Critical, Important, or blocking Minor issues.
- commit:
  - `2ccf3f9 feat(devtools): capture refsubject runtime events`
- context_updates:
  - Added `makeRefSubjectCapture` for converting RefSubject DevTools observer events into protocol runtime events.
  - Added value serialization/redaction before events enter the runtime bridge event bus.
  - Added identity handling that uses service ids, owner-qualified local ids, or explicit ids and skips unidentifiable events.
- memory_updates:
  - Runtime RefSubject capture must serialize values before calling `DevtoolsRuntimeService.emit`; raw values should not reach the bridge bus.
  - RefSubject capture should prefer service ids, then owner-qualified local ids, then explicit ids; missing identity should be skipped instead of mapped to a shared anonymous id.

### T14 - Fx DevTools Hooks

- task_id: T14
- requirement_ids: FR-20, FR-21, FR-22, FR-23, FR-41, FR-42, NFR-3, NFR-4, NFR-6, NFR-15, NFR-17, AC-4, AC-5, AC-13
- ts_scenarios: TS-4, TS-11
- routing_decision:
  - direct execution for the red-green implementation because target files and ownership are locked in the approved plan.
  - sidecar review-auditor required before commit for semantic-preservation and boundary risks.
- validation_evidence:
  - red: `pnpm --filter @typed/fx exec vitest run src/Fx.devtools.test.ts src/Fx.lifecycle.test.ts src/Fx.test.ts` failed before implementation with missing `./Fx/devtools.js`; the existing lifecycle and Fx tests passed in the same run.
  - green: `pnpm --filter @typed/fx exec vitest run src/Fx.devtools.test.ts src/Fx.lifecycle.test.ts src/Fx.test.ts` passed with 3 test files and 17 tests.
  - green: `pnpm --filter @typed/fx build` passed.
  - green: `pnpm exec oxlint packages/fx/src/Fx/devtools.ts packages/fx/src/Fx.devtools.test.ts packages/fx/src/Fx/index.ts packages/fx/src/index.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/fx/src/Fx/devtools.ts packages/fx/src/Fx.devtools.test.ts packages/fx/src/Fx/index.ts packages/fx/src/index.ts` passed.
  - green: boundary grep for `chrome.`, `effect/unstable/rpc`, and `@typed/devtools-protocol` returned no matches.
  - green: `git diff --check -- packages/fx .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found no Critical or Important issues; it noted a defensible T15 placement caveat for graph-boundary capture after downstream operators like `take`.
- commit:
  - `69fc84a feat(devtools): add fx devtools hooks`
- context_updates:
  - Added `withFxDevtools` / `withDevtools` as opt-in Fx lifecycle instrumentation.
  - Added host-neutral Fx DevTools event and observer types for start, emit, failure, completion, and interruption.
  - Exported Fx DevTools hooks through the Fx barrel and root `FxDevtools` namespace.
- memory_updates:
  - Fx DevTools hooks should stay opt-in around a specific `Fx`; global constructor instrumentation waits for app/runtime config wiring.
  - Fx lifecycle instrumentation must record only the first terminal event, so failed or interrupted streams do not also emit `Completed`.
  - Keep Fx DevTools ids as host-neutral runtime strings inside `@typed/fx`; protocol id branding belongs in runtime capture.

### T15 - Runtime Fx Capture

- task_id: T15
- requirement_ids: FR-20, FR-21, FR-22, FR-23, FR-24, FR-41, FR-42, NFR-3, NFR-4, NFR-6, NFR-15, NFR-17, AC-4, AC-5, AC-13
- ts_scenarios: TS-4, TS-11
- routing_decision:
  - direct execution for the red-green implementation because target files and ownership are locked in the approved plan.
  - sidecar review-auditor required before commit for lifecycle mapping, serialization, identity, and boundary risks.
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-runtime exec vitest run src/FxCapture.test.ts` failed before implementation with missing `./FxCapture.js`.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/FxCapture.test.ts` passed with 1 test file and 4 tests.
  - red: `pnpm --filter @typed/devtools-runtime build` initially failed with TS2339 because `FxCapture.ts` indexed `phase` on the full `RuntimeEventEnvelope` union instead of the `FxNodeEvent` member.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/FxCapture.test.ts src/EventBus.test.ts src/Bridge.test.ts` passed with 3 test files and 19 tests.
  - green: `pnpm --filter @typed/devtools-runtime build` passed.
  - green: `pnpm exec oxlint packages/devtools-runtime/src/FxCapture.ts packages/devtools-runtime/src/FxCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-runtime/src/FxCapture.ts packages/devtools-runtime/src/FxCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed.
  - green: boundary grep for `chrome.` and `effect/unstable/rpc` returned no matches.
  - green: `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found no Critical or Important issues; it noted only a non-blocking suggestion for more focused serialized `Cause` payload assertions.
- commit:
  - `e81996d feat(devtools): capture fx runtime events`
- context_updates:
  - Added `makeFxCapture` for converting Fx DevTools observer events into protocol `FxNodeEvent` runtime events.
  - Added value and cause serialization/redaction before Fx events enter the runtime bridge event bus.
  - Added identity handling for component-owned, RefSubject-derived, explicit unowned, and unidentifiable Fx events.
- memory_updates:
  - Runtime Fx capture should serialize emitted values and failure/interruption causes before calling `DevtoolsRuntimeService.emit`.
  - Fx node ids should prefer owner-qualified ids, then RefSubject-qualified ids, then explicit unowned ids; missing identity should be skipped.
  - Type helpers for protocol runtime events should narrow to the `FxNodeEvent` union member before reading phase/value fields.

### T16 - Runtime HMR Capture

- task_id: T16
- requirement_ids: FR-17, FR-25, FR-26, FR-41, FR-42, NFR-6, NFR-8, NFR-15, NFR-17, AC-6, AC-13
- ts_scenarios: TS-6, TS-11
- routing_decision:
  - direct execution for the red-green implementation because target files and ownership are locked in the approved plan.
  - sidecar review-auditor required before commit for HMR status preservation, EventBus reuse, and runtime/compiler boundary risks.
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-runtime exec vitest run src/HmrCapture.test.ts` failed before implementation with missing `./HmrCapture.js`.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/HmrCapture.test.ts` passed with 1 test file and 3 tests.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/HmrCapture.test.ts src/EventBus.test.ts src/Bridge.test.ts` passed with 3 test files and 18 tests.
  - green: `pnpm --filter @typed/devtools-runtime build` passed.
  - green: `pnpm exec oxlint packages/devtools-runtime/src/HmrCapture.ts packages/devtools-runtime/src/HmrCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-runtime/src/HmrCapture.ts packages/devtools-runtime/src/HmrCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed.
  - green: boundary grep for `chrome.`, `effect/unstable/rpc`, and `@typed/compiler` returned no matches.
  - green: `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found no Critical or Important issues in the scoped T16 files; it flagged an unrelated package-wide runtime test typecheck failure in `RefSubjectCapture.test.ts` to track before package-wide runtime test health is claimed.
- commit:
  - `33f3015 feat(devtools): capture hmr runtime facts`
- context_updates:
  - Added `makeHmrCapture` for emitting protocol HMR status facts through the runtime service and bridge event bus.
  - Preserved optimized-template status, stateful eligibility, unknown status, and structured rejection reasons exactly as compiler facts provide them.
- memory_updates:
  - Runtime HMR capture should consume protocol `HmrStatusFact` values directly and avoid importing compiler packages.
  - Runtime HMR capture should reuse `DevtoolsRuntimeService.emit` and EventBus retention instead of keeping a separate HMR history.

### Runtime Package Typecheck Repair

- task_id: validation-repair-runtime-typecheck
- requirement_ids: NFR-15, NFR-17
- ts_scenarios: TS-5, TS-11
- routing_decision:
  - direct execution because this was a narrow test type-narrowing repair discovered by T16 review.
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-runtime run test:typecheck` failed with TS2339 at `src/RefSubjectCapture.test.ts(131,52)` because the test read `.version` on the full `RuntimeEventEnvelope` union.
  - green: `pnpm --filter @typed/devtools-runtime run test:typecheck` passed.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/RefSubjectCapture.test.ts src/FxCapture.test.ts src/HmrCapture.test.ts` passed with 3 test files and 11 tests.
  - green: `pnpm --filter @typed/devtools-runtime test` passed with typecheck plus 7 test files and 38 tests.
  - green: `pnpm exec oxlint packages/devtools-runtime/src/RefSubjectCapture.test.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-runtime/src/RefSubjectCapture.test.ts` passed.
  - green: `git diff --check -- packages/devtools-runtime/src/RefSubjectCapture.test.ts` passed.
- commit:
  - `96c2a01 test(devtools): restore runtime test typecheck`
- context_updates:
  - Narrowed bounded RefSubject replay version assertions to RefSubject runtime event variants before reading `version`.
- memory_updates:
  - Runtime event tests should narrow `RuntimeEventEnvelope` to a concrete event variant before reading variant-specific fields.

### T17 - Runtime Navigation Capture

- task_id: T17
- requirement_ids: FR-27, FR-28, FR-41, FR-42, NFR-6, NFR-14, NFR-15, NFR-17, AC-7, AC-13
- ts_scenarios: TS-7, TS-11
- routing_decision:
  - direct execution for the red-green implementation because target files and ownership are locked in the approved plan.
  - sidecar review-auditor required before commit for canonical navigation model usage, id stability, EventBus reuse, and boundary risks.
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-runtime exec vitest run src/NavigationCapture.test.ts` failed before implementation with missing `./NavigationCapture.js`.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/NavigationCapture.test.ts` passed with 1 test file and 4 tests.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/NavigationCapture.test.ts src/EventBus.test.ts src/Bridge.test.ts` passed with 3 test files and 19 tests.
  - green: `pnpm --filter @typed/devtools-runtime build` passed.
  - green: `pnpm exec oxlint packages/devtools-runtime/src/NavigationCapture.ts packages/devtools-runtime/src/NavigationCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-runtime/src/NavigationCapture.ts packages/devtools-runtime/src/NavigationCapture.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed.
  - green: boundary grep for `chrome.` and `effect/unstable/rpc` returned no matches.
  - green: `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - green: `pnpm --filter @typed/devtools-runtime test` passed with typecheck plus 8 test files and 43 tests.
  - review: Sidecar review found an Important behavior-preservation issue where capture defects could affect `NavigationHandler`; after adding diagnostic failure isolation and regression coverage, re-review found the issue resolved with no blocking findings.
- commit:
  - `ba10685 feat(devtools): capture navigation runtime events`
- context_updates:
  - Added `makeNavigationCapture` for converting canonical `@typed/navigation` `NavigationEvent` values into protocol runtime events.
  - Added a `NavigationHandler`-compatible hook for wiring capture through `Navigation.onNavigation`.
  - Reused DevTools runtime EventBus retention and bridge navigation capability filtering.
- memory_updates:
  - Runtime Navigation capture should consume `@typed/navigation` `NavigationEvent` values and expose a `NavigationHandler`-compatible hook for `Navigation.onNavigation`.
  - Navigation runtime event ids can default to `<navigation type>:<destination id>`; custom correlation ids belong behind a `resolveId` option.
  - Runtime Navigation capture failures from id resolution, time sources, or runtime emission must be swallowed because capture is diagnostic-only.

### T18 - Runtime OTEL Correlation

- task_id: T18
- requirement_ids: FR-28, FR-29, FR-41, FR-42, NFR-6, NFR-14, NFR-15, NFR-17, AC-8, AC-13
- ts_scenarios: TS-8, TS-11
- routing_decision:
  - direct execution for the red-green implementation because target files and ownership are locked in the approved plan.
  - sidecar review-auditor required before commit for OTEL id preservation, Typed correlation boundaries, EventBus reuse, and protocol compliance.
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-runtime exec vitest run src/OtelCorrelation.test.ts` failed before implementation with missing `./OtelCorrelation.js`.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/OtelCorrelation.test.ts` passed with 1 test file and 4 tests.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/OtelCorrelation.test.ts src/EventBus.test.ts src/Bridge.test.ts` passed with 3 test files and 19 tests.
  - green: `pnpm --filter @typed/devtools-runtime build` passed.
  - green: `pnpm exec oxlint packages/devtools-runtime/src/OtelCorrelation.ts packages/devtools-runtime/src/OtelCorrelation.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-runtime/src/OtelCorrelation.ts packages/devtools-runtime/src/OtelCorrelation.test.ts packages/devtools-runtime/src/EventBus.test.ts packages/devtools-runtime/src/Bridge.test.ts packages/devtools-runtime/src/index.ts` passed.
  - green: boundary grep for `chrome.` and `effect/unstable/rpc` returned no matches.
  - green: `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - green: `pnpm --filter @typed/devtools-runtime test` passed with typecheck plus 9 test files and 47 tests.
  - review: Sidecar review found no Critical or Important issues.
- commit:
  - `4586bf9 feat(devtools): correlate otel runtime spans`
- context_updates:
  - Added `makeOtelCorrelation` for emitting protocol `OtelSpan` runtime events through the DevTools runtime service.
  - Preserved OTEL `traceId` and `spanId` verbatim while attaching optional Typed correlation ids as metadata.
  - Reused DevTools runtime EventBus retention and bridge `otel` capability filtering.
- memory_updates:
  - Runtime OTEL correlation should preserve `traceId` and `spanId` verbatim and only attach Typed ids as additive metadata.
  - Runtime OTEL correlation should emit protocol `OtelSpan` events through `DevtoolsRuntimeService.emit` so EventBus retention and bridge capability filtering stay shared.

### T19 - Analyzer Bridge RPC Handler

- task_id: T19
- requirement_ids: FR-32, FR-33, FR-34, FR-35, FR-36, FR-37, FR-43, FR-44, FR-45, NFR-8, NFR-14, NFR-17, NFR-18, AC-10, AC-11, AC-14
- ts_scenarios: TS-10, TS-12
- routing_decision:
  - direct execution for the red-green implementation because target files and ownership are locked and the task only touches runtime bridge wiring.
  - sidecar review-auditor required before commit for AnalyzeSource RPC routing, capability advertisement, unavailable-state behavior, and absence of runtime AST/compiler fallback.
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-runtime exec vitest run src/Bridge.test.ts` failed because an injected Analyzer handler still left `source-analyzer` out of the accepted handshake capabilities.
  - green: `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts` passed with 1 test file and 6 tests.
  - review: Compiler sidecar found an Important duplicate `ComponentDefinition` issue when exported component declarations were also direct `html` templates.
  - red: duplicate regression `does not duplicate exported html component definitions` failed with two facts for `cmp:src/Counter.ts#Counter`.
  - red: after fixing duplicate component facts, `pnpm --filter @typed/compiler build` failed because the dedupe set read `componentId` through the union `SourceAnalyzerFact` type.
  - green: after switching the dedupe key to `DerivedComponentIdentity.componentId`, `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts` passed with 1 test file and 7 tests.
  - green: `pnpm --filter @typed/compiler build` passed.
  - review: Compiler re-review found an Important selection regression where a request positioned on the `html` token could no longer match the deduped declaration fact.
  - red: template-token selection regression failed with an empty `facts` array.
  - green: after adding alternate match spans, `pnpm --filter @typed/compiler exec vitest run src/devtools/sourceAnalyzer.test.ts` passed with 1 test file and 8 tests.
  - green: after alternate-span fix, `pnpm --filter @typed/compiler build` passed.
  - green: `pnpm --filter @typed/devtools-runtime exec vitest run src/Bridge.test.ts` passed with 1 test file and 10 tests.
  - green: `pnpm --filter @typed/devtools-runtime build` passed.
  - green: `pnpm --filter @typed/devtools-runtime test` passed with typecheck plus 9 test files and 48 tests.
  - green: `pnpm exec oxlint packages/devtools-runtime/src/Bridge.ts packages/devtools-runtime/src/Bridge.test.ts packages/compiler/src/devtools/sourceAnalyzer.ts packages/compiler/src/devtools/sourceAnalyzer.test.ts` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-runtime/src/Bridge.ts packages/devtools-runtime/src/Bridge.test.ts packages/compiler/src/devtools/sourceAnalyzer.ts packages/compiler/src/devtools/sourceAnalyzer.test.ts` passed.
  - green: boundary grep for `chrome.`, `effect/unstable/rpc`, and `@typed/compiler` imports in runtime bridge files returned no matches.
  - green: `git diff --check -- packages/devtools-runtime .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Runtime bridge sidecar found no Critical or Important issues. One Low test-depth note about not directly invoking `handlers.AnalyzeSource` was accepted because runtime tests intentionally avoid importing or fabricating unstable RPC handler metadata; the handler delegates through `bridge.analyzeSource`.
  - review: Final compiler sidecar re-review found no Critical or Important issues after the alternate-span fix.
- commit:
  - `bd79a00 feat(devtools): bridge compiler source analyzer`
- context_updates:
  - Added Source Analyzer component declaration facts by reusing compiler-owned `deriveComponentIdentities`, and filtered same-named Fx closure facts to avoid duplicate component/root facts.
  - Deduped exported `html` component facts by component id while preserving declaration source locations and template-token match spans for selection filtering.
  - Added bridge coverage for injected Analyzer handlers returning protocol `SourceFacts` through the bridge Analyzer path used by `handlers.AnalyzeSource`.
  - Added runtime bridge capability resolution so default capabilities include `source-analyzer` only when an Analyzer handler is injected.
- memory_updates:
  - Source Analyzer should reuse compiler component identity derivation for exported component declarations and aliases instead of reimplementing component detection locally.
  - Deduped Source Analyzer component facts may need alternate match spans so selection on template expressions still returns the declaration-owned fact.
  - Runtime AnalyzeSource bridge support stays host-neutral: inject a compiler/dev-server handler into the bridge instead of importing compiler packages into `@typed/devtools-runtime`.
  - The bridge should advertise `source-analyzer` by default only when an Analyzer handler is installed; otherwise the RPC path returns an explicit unavailable state.

### T20 - Chrome DevTools Package Shell and Runtime Transport

- task_id: T20
- requirement_ids: FR-30, FR-31, FR-38, FR-39, FR-43, FR-44, FR-45, NFR-1, NFR-9, NFR-12, NFR-15, NFR-17, NFR-18, AC-9, AC-10, AC-14
- ts_scenarios: TS-9, TS-12
- routing_decision:
  - direct execution for the red-green implementation because target package/files are locked in the approved plan and the first slice is a narrow package shell plus transport adapter.
  - sidecar review-auditor required before commit for MV3 manifest shape, DevTools page API usage, protocol-derived transport typing, package boundary compliance, and publish/package wiring.
- source_context:
  - Chrome DevTools extension docs: `devtools_page` must point to a local HTML page, `chrome.devtools.*` APIs are available only to pages loaded in the DevTools window, and DevTools extensions should continue using `chrome.*`.
  - Chrome `devtools.panels` docs: `chrome.devtools.panels.create` creates a panel from title/icon/page path and requires the manifest `devtools_page` key.
  - Chrome messaging docs: long-lived extension connections use `chrome.runtime.connect({ name })` and a Port that sends messages via `postMessage`.
- validation_evidence:
  - red: before workspace install, `pnpm --filter @typed/devtools-chrome exec vitest run src/transport/chromeRuntime.test.ts` failed because the new package did not yet have a `@typed/devtools-protocol` symlink.
  - red: after lockfile and workspace install, the focused test failed with missing `../devtoolsPage.js`, proving the implementation modules were absent.
  - green: `pnpm --filter @typed/devtools-chrome exec vitest run src/transport/chromeRuntime.test.ts` passed with 1 test file and 5 tests.
  - green: `pnpm --filter @typed/devtools-chrome build` passed.
  - red: `pnpm --filter @typed/devtools-chrome test` initially failed typecheck because the transport type test asserted exact fixture-literal equality against Effect schema-derived payload types.
  - green: after changing the assertion to protocol request assignability, `pnpm --filter @typed/devtools-chrome test` passed with typecheck plus 1 test file and 5 tests.
  - green: final `pnpm --filter @typed/devtools-chrome test` passed with typecheck plus 1 test file and 5 tests.
  - green: final `pnpm --filter @typed/devtools-chrome build` passed.
  - green: `pnpm exec oxlint packages/devtools-chrome/src` passed with 0 warnings and 0 errors.
  - red: first `pnpm exec oxfmt --check packages/devtools-chrome/src packages/devtools-chrome/package.json packages/devtools-chrome/tsconfig.json packages/devtools-chrome/tsconfig.test.json` failed on `chromeRuntime.ts` and `chromeRuntime.test.ts`.
  - green: after formatting, `pnpm exec oxfmt --check packages/devtools-chrome/src packages/devtools-chrome/package.json packages/devtools-chrome/tsconfig.json packages/devtools-chrome/tsconfig.test.json` passed.
  - green: boundary grep for `effect/unstable/rpc` outside `transport/chromeRuntime.ts` returned no matches.
  - green: boundary grep for forbidden `@typed/*` package imports returned no matches.
  - green: `chrome.` grep matched only `packages/devtools-chrome/src/devtoolsPage.ts` and its test text inside the Chrome package.
  - green: `git diff --check -- packages/devtools-chrome pnpm-lock.yaml scripts/publish-beta.sh .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found an Important issue where a wrong-tag or incomplete Chrome runtime response could consume a pending request because only protocol/id were checked.
  - red: wrong-tag/incomplete response regression failed because an `AnalyzeSource` response resolved a pending `Handshake` request.
  - green: after storing the expected tag and requiring exactly one of `success` or `error`, `pnpm --filter @typed/devtools-chrome exec vitest run src/transport/chromeRuntime.test.ts` passed with 1 test file and 6 tests.
  - green: final `pnpm --filter @typed/devtools-chrome test` passed with typecheck plus 1 test file and 6 tests.
  - green: final `pnpm --filter @typed/devtools-chrome build` passed.
  - green: final `pnpm exec oxlint packages/devtools-chrome/src` passed with 0 warnings and 0 errors.
  - green: final `pnpm exec oxfmt --check packages/devtools-chrome/src packages/devtools-chrome/package.json packages/devtools-chrome/tsconfig.json packages/devtools-chrome/tsconfig.test.json` passed.
  - green: final boundary greps for restricted `effect/unstable/rpc`, forbidden `@typed/*` package imports, and Chrome API placement passed.
  - green: final `git diff --check -- packages/devtools-chrome pnpm-lock.yaml scripts/publish-beta.sh .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Focused re-review found no Critical or Important issues after the response validation fix.
- commit:
  - `9c06234 feat(devtools): add chrome devtools shell`
- context_updates:
  - Added `@typed/devtools-chrome` package shell with Manifest V3 DevTools manifest helper, callback-style DevTools panel registration, and Chrome runtime Port RPC client.
  - Added protocol-derived Chrome runtime transport envelope types using `TypedDevtoolsRpc` tags/payloads/results instead of redeclaring protocol message unions.
  - Hardened the Chrome runtime transport to ignore wrong-tag or incomplete responses before consuming pending requests.
  - Added the Chrome package to beta publish ordering after `@typed/devtools-protocol`.
- memory_updates:
  - DevTools Chrome package code should use `chrome.*` APIs directly; Chrome DevTools extension docs say the `browser` namespace is disabled for extensions declaring `devtools_page`.
  - Chrome transport envelope types should derive tags, payloads, and successes from `@typed/devtools-protocol` RPC types instead of redeclaring protocol message unions in the Chrome package.
  - Chrome runtime transport pending requests must retain the expected RPC tag and ignore incomplete responses before settling the request.

### T21 - Chrome Panel State and Initial Views

- task_id: T21
- requirement_ids: FR-30, FR-31, FR-38, FR-39, FR-40, FR-41, FR-42, NFR-9, NFR-10, NFR-12, NFR-15, NFR-17, AC-9, AC-10, AC-11, AC-13
- ts_scenarios: TS-9, TS-11
- routing_decision:
  - direct execution for the red-green implementation because target files and dependencies are locked and the state/view model slice has one cohesive write set.
  - sidecar review-auditor required before commit for protocol-only state derivation, view-model stability, deep-link ids, replay/reconnect handling, and package boundary compliance.
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-chrome exec vitest run src/panel/state.test.ts` failed with missing `./state.js`.
  - green: `pnpm --filter @typed/devtools-chrome exec vitest run src/panel/state.test.ts` passed with 1 test file and 3 tests.
  - red: `pnpm --filter @typed/devtools-chrome test` initially failed typecheck because the synthetic event array widened literal `_tag` values before reducing through `applyRuntimeStreamItem`.
  - green: after typing synthetic events as `RuntimeEventStreamItem[]`, `pnpm --filter @typed/devtools-chrome test` passed with typecheck plus 2 test files and 9 tests.
  - green: `pnpm --filter @typed/devtools-chrome build` passed.
  - green: `pnpm exec oxlint packages/devtools-chrome/src` passed with 0 warnings and 0 errors.
  - red: first `pnpm exec oxfmt --check packages/devtools-chrome/src` failed on `src/panel/state.test.ts`.
  - green: after formatting, `pnpm exec oxfmt --check packages/devtools-chrome/src` passed.
  - green: boundary grep for forbidden non-protocol `@typed/*` imports in panel files returned no matches.
  - green: `git diff --check -- packages/devtools-chrome .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found Important issues where non-ready replay states left stale rows visible and RefSubject rows dropped the serialized value.
  - red: non-ready replay/value regressions failed because stale component rows remained after `SessionMismatch` and RefSubject rows omitted `value`.
  - green: after clearing accumulated rows for non-ready replay states and adding RefSubject row values, `pnpm --filter @typed/devtools-chrome exec vitest run src/panel/state.test.ts` passed with 1 test file and 5 tests.
  - green: final `pnpm --filter @typed/devtools-chrome test` passed with typecheck plus 2 test files and 11 tests.
  - green: final `pnpm --filter @typed/devtools-chrome build` passed.
  - green: final `pnpm exec oxlint packages/devtools-chrome/src` passed with 0 warnings and 0 errors.
  - green: final `pnpm exec oxfmt --check packages/devtools-chrome/src` passed.
  - review: Focused re-review found no Critical or Important issues after replay/value fixes.
- commit:
  - `84a96d6 feat(devtools): add chrome panel state`
- context_updates:
  - Added protocol-only panel state accumulation for component, Fx, RefSubject, and replay state events.
  - Added Components/Templates, Fx, and RefSubjects panel row view models with stable `typed://` deep links derived from protocol ids.
  - Cleared accumulated rows when replay state is not `Ready`, and exposed serialized RefSubject values in view rows.
- memory_updates:
  - Chrome panel state should derive entirely from protocol `RuntimeEventStreamItem` values and expose stable `typed://` deep links from protocol ids for view rows.
  - Non-ready runtime replay states should clear or stale-mark accumulated Chrome panel rows before applying retained events.

### T22 - Chrome Elements Sidebar and Inspected Window Transport

- task_id: T22
- requirement_ids: FR-30, FR-31, FR-38, FR-39, FR-41, FR-42, FR-43, FR-44, FR-45, NFR-9, NFR-12, NFR-15, NFR-17, NFR-18, AC-9, AC-10, AC-13, AC-14
- ts_scenarios: TS-9, TS-12
- routing_decision:
  - direct execution for the red-green implementation because target files are locked and the slice is a narrow Chrome-only adapter/sidebar feature.
  - sidecar review-auditor required before commit for inspected-window eval safety/error handling, protocol decoding, Elements sidebar callback wiring, summary/deep-link completeness, and package boundary compliance.
- source_context:
  - Chrome inspected-window docs: `chrome.devtools.inspectedWindow.eval` executes in the inspected page context, returns JSON-compatible values, and reports DevTools-side or JavaScript exceptions through the callback.
  - Chrome DevTools docs: `chrome.devtools.*` APIs are available only to pages loaded in DevTools, and DevTools extensions declaring `devtools_page` should keep using `chrome.*`.
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-chrome exec vitest run src/transport/inspectedWindow.test.ts` failed with missing `../elementsSidebar.js`.
  - green: `pnpm --filter @typed/devtools-chrome exec vitest run src/transport/inspectedWindow.test.ts` passed with 1 test file and 4 tests.
  - red: `pnpm --filter @typed/devtools-chrome test` initially failed typecheck and lint because `DomBindingResolution` was imported but unused in `inspectedWindow.test.ts`.
  - green: after removing the unused import, `pnpm --filter @typed/devtools-chrome test` passed with typecheck plus 3 test files and 15 tests.
  - green: `pnpm --filter @typed/devtools-chrome build` passed.
  - green: `pnpm exec oxlint packages/devtools-chrome/src` passed with 0 warnings and 0 errors.
  - red: first `pnpm exec oxfmt --check packages/devtools-chrome/src` failed on `src/transport/inspectedWindow.test.ts`.
  - green: after formatting, `pnpm exec oxfmt --check packages/devtools-chrome/src` passed.
  - green: boundary grep for forbidden non-protocol `@typed/*` imports in T22 files returned no matches.
  - green: `git diff --check -- packages/devtools-chrome .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found Important issues where synchronous `inspectedWindow.eval` throws and resolver rejections escaped as promise failures, and stale async selection resolutions could overwrite newer sidebar summaries.
  - red: new regressions failed because sync `eval` throws rejected the resolver, resolver rejections escaped the sidebar listener, and older delayed selections were still rendered after newer selections.
  - green: after converting throws/rejections to explicit `Unbound` results and guarding sidebar updates with a monotonic request token, `pnpm --filter @typed/devtools-chrome exec vitest run src/transport/inspectedWindow.test.ts` passed with 1 test file and 7 tests.
  - green: final `pnpm --filter @typed/devtools-chrome test` passed with typecheck plus 3 test files and 18 tests.
  - green: final `pnpm --filter @typed/devtools-chrome build` passed.
  - green: final `pnpm exec oxlint packages/devtools-chrome/src` passed with 0 warnings and 0 errors.
  - green: final `pnpm exec oxfmt --check packages/devtools-chrome/src` passed.
  - green: final boundary grep for forbidden non-protocol `@typed/*` imports in T22 files returned no matches.
  - green: final `git diff --check -- packages/devtools-chrome .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Focused re-review found no Critical or Important issues after the eval/rejection/race fixes.
- commit:
  - `072803b feat(devtools): add elements sidebar bridge`
- context_updates:
  - Added inspected-window selected-node resolver that evaluates a page-side Typed DevTools DOM bridge and decodes the result as protocol `DomBindingResolution`.
  - Added Elements sidebar registration and resolved/unbound sidebar view models with component, template, Fx, and RefSubject deep links.
  - Hardened Elements selection updates so rejected or throwing bridges render explicit unbound results and delayed stale selections cannot overwrite the latest summary.
- memory_updates:
  - Chrome inspected-window selected-node transport should decode page-side DOM bridge results through `DomBindingResolutionSchema` and fall back to explicit `Unbound` results for eval failures or invalid payloads.
  - Elements sidebar selection listeners should catch resolver rejections and should apply only the newest async selected-node resolution, using a monotonic request token to avoid stale summaries.

### T23 - Chrome Sources Analyzer Sidebar

- task_id: T23
- requirement_ids: FR-30, FR-31, FR-32, FR-33, FR-34, FR-35, FR-36, FR-37, FR-38, FR-39, NFR-9, NFR-12, NFR-15, NFR-17, NFR-18, AC-9, AC-10, AC-14
- ts_scenarios: TS-9, TS-10, TS-12
- routing_decision:
  - direct execution for the red-green implementation because target files are locked and the slice is a narrow Chrome-only Sources sidebar adapter.
  - sidecar review-auditor required before commit for Sources panel API usage, AnalyzeSource protocol boundary, unavailable bridge behavior, stale async selection handling, and package boundary compliance.
- source_context:
  - Chrome `devtools.panels` docs: `chrome.devtools.panels.sources.createSidebarPane` creates a Sources panel sidebar, and `sources.onSelectionChanged.addListener` receives a no-argument callback.
  - Chrome DevTools extension docs: `chrome.devtools.*` APIs are only available to DevTools pages declared through `devtools_page`; the Sources selection callback does not expose resource or cursor payloads, so the adapter uses an injected source-selection provider.
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-chrome exec vitest run src/sourcesSidebar.test.ts` failed with missing `./sourcesSidebar.js`.
  - red: after initial implementation, focused tests found a bad source-location literal in the model expectation; typecheck also found an exported sidebar pane name collision, unsafe `_tag` narrowing on source-selection results, and an over-narrow deferred test type.
  - green: after correcting the protocol id expectation, renaming the Sources pane interface, adding an explicit unavailable-selection type guard, and widening deferred response types, `pnpm --filter @typed/devtools-chrome exec vitest run src/sourcesSidebar.test.ts` passed with 1 test file and 4 tests.
  - green: `pnpm --filter @typed/devtools-chrome test` passed with typecheck plus 4 test files and 22 tests.
  - green: `pnpm --filter @typed/devtools-chrome build` passed.
  - green: `pnpm exec oxlint packages/devtools-chrome/src` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-chrome/src` passed.
  - green: boundary grep for forbidden non-protocol `@typed/*` imports in T23 files returned no matches.
  - green: `git diff --check -- packages/devtools-chrome .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found Important coverage gaps for the production `chrome.runtime` AnalyzeSource path and the analyzer rejection fallback.
  - green: after adding coverage for runtime AnalyzeSource requests and analyzer rejection-to-Unavailable fallback, `pnpm --filter @typed/devtools-chrome exec vitest run src/sourcesSidebar.test.ts` passed with 1 test file and 6 tests.
  - green: final `pnpm --filter @typed/devtools-chrome test` passed with typecheck plus 4 test files and 24 tests.
  - green: final `pnpm --filter @typed/devtools-chrome build` passed.
  - green: final `pnpm exec oxlint packages/devtools-chrome/src` passed with 0 warnings and 0 errors.
  - green: final `pnpm exec oxfmt --check packages/devtools-chrome/src` passed.
  - green: final boundary grep for forbidden non-protocol `@typed/*` imports in T23 files returned no matches.
  - green: final `git diff --check -- packages/devtools-chrome .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Focused re-review found no Critical or Important issues after the runtime-path and rejection-fallback tests.
- commit:
  - `36040d4 feat(devtools): add sources analyzer sidebar`
- context_updates:
  - Added Sources sidebar registration over `chrome.devtools.panels.sources` with injectable source selection and protocol AnalyzeSource clients.
  - Added protocol-derived SourceFacts/Unavailable sidebar models with stable component, Fx, RefSubject, and source deep links.
  - Added unavailable bridge handling and monotonic async selection guards for Sources sidebar updates.
- memory_updates:
  - Chrome Sources sidebar selection needs an injected source-selection provider because `sources.onSelectionChanged` does not provide resource or cursor payloads.
  - Source Analyzer sidebar models should preserve branded `SourceLocationId` values, including the `src:` prefix, when building source deep links.

### T24 - Chrome DevTools Smoke Coverage and Manual Browser Steps

- task_id: T24
- requirement_ids: FR-30, FR-31, FR-38, FR-39, FR-40, FR-43, FR-44, FR-45, NFR-9, NFR-10, NFR-11, NFR-12, NFR-17, NFR-18, AC-9, AC-10, AC-11, AC-12, AC-14
- ts_scenarios: TS-9, TS-11, TS-12
- routing_decision:
  - direct execution for the red-green implementation because target files are locked and the slice is test/manual smoke coverage around existing Chrome package exports.
  - sidecar review-auditor required before commit for smoke coverage adequacy, manual browser step accuracy, reconnect/reload behavior, and package boundary compliance.
- source_context:
  - Chrome extension docs: load unpacked testing uses `chrome://extensions`, Developer Mode, and Load unpacked on the extension directory.
  - Chrome DevTools extension docs: `devtools_page` must be an HTML page local to the extension, and DevTools pages can create panels/sidebars while communicating with runtime/background pages through `chrome.runtime.connect`.
  - Chrome `devtools.panels` docs: DevTools extension panels and sidebars are separate HTML pages, and sidebar panes can display JSON via `setObject` or extension HTML via `setPage`.
- validation_evidence:
  - red: `pnpm --filter @typed/devtools-chrome exec vitest run src/devtoolsSmoke.test.ts` failed because `packages/devtools-chrome/MANUAL_SMOKE.md` did not exist.
  - green: after adding `MANUAL_SMOKE.md`, `pnpm --filter @typed/devtools-chrome exec vitest run src/devtoolsSmoke.test.ts` passed with 1 test file and 3 tests.
  - red: `pnpm --filter @typed/devtools-chrome test` failed because `devtoolsSmoke.test.ts` imported Node built-in modules, but the package test typecheck does not include Node built-in module types.
  - green: after switching the manual doc assertion to a Vite raw Markdown import and adding `src/raw.d.ts`, `pnpm --filter @typed/devtools-chrome exec vitest run src/devtoolsSmoke.test.ts` passed with 1 test file and 3 tests.
  - green: `pnpm --filter @typed/devtools-chrome test` passed with typecheck plus 5 test files and 27 tests.
  - green: `pnpm --filter @typed/devtools-chrome build` passed.
  - green: `pnpm exec oxlint packages/devtools-chrome/src` passed with 0 warnings and 0 errors.
  - green: `pnpm exec oxfmt --check packages/devtools-chrome/src` passed.
  - green: boundary grep for forbidden non-protocol `@typed/*` imports in T24 files returned no matches.
  - green: `git diff --check -- packages/devtools-chrome .docs/workflows/20260523-1548-developer-tooling-chrome-extension` passed.
  - review: Sidecar review found no Critical or Important issues; automated smoke scope, browser blocker honesty, runtime reconnect coverage, package boundary compliance, and `raw.d.ts` were accepted.
- commit:
  - `68316a4 test(devtools): add chrome smoke coverage`
- context_updates:
  - Added automated smoke coverage for Manifest V3 metadata, DevTools panel registration, Elements sidebar selection rendering, Sources Analyzer runtime RPC rendering, and runtime connect/reconnect.
  - Added `MANUAL_SMOKE.md` with exact browser smoke steps and an explicit blocker for the missing load-unpacked extension root.
  - Added a package-local raw Markdown module declaration so smoke tests can assert manual documentation without Node built-in test types.
- memory_updates:
  - Chrome package smoke tests should avoid Node built-in imports because `@typed/devtools-chrome` test typecheck does not include Node built-in module types.
  - Browser load-unpacked smoke remains blocked until `@typed/devtools-chrome` emits a complete extension root with `manifest.json`, DevTools HTML pages, sidebar HTML pages, and icon assets.

### T25 - Host-Neutral Storybook DevTools Fixtures

- task_id: T25
- requirement_ids: FR-40, FR-41, FR-42, NFR-10, NFR-11, NFR-15, NFR-17, AC-11, AC-12, AC-13
- ts_scenarios: TS-11
- routing_decision:
  - direct execution for the red-green implementation because target files are locked and the slice is a narrow host-neutral fixture adapter.
  - sidecar review-auditor required before commit for host-neutral fixture shape, protocol-boundary compliance, Storybook dependency correctness, and runtime fact coverage.
- source_context:
  - `@typed/storybook` does not currently declare `@typed/devtools-protocol`; T25 adds that dependency because Storybook source must consume protocol fixture values at runtime.
  - Existing Storybook dirty files are unrelated to T25 and must not be staged.
- validation_evidence:
  - RED: `pnpm --filter @typed/storybook exec vitest run src/devtoolsFixtures.test.ts` failed before `devtoolsFixtures.ts` existed.
  - GREEN: `pnpm --filter @typed/storybook exec vitest run src/devtoolsFixtures.test.ts` passed with 1 file and 3 tests.
  - GREEN: `pnpm --filter @typed/devtools-protocol test` passed with 4 files and 25 tests.
  - GREEN: `pnpm --filter @typed/devtools-protocol build` passed.
  - GREEN: `pnpm --filter @typed/storybook build` passed.
  - LINT: `pnpm exec oxlint packages/storybook/src/devtoolsFixtures.ts packages/storybook/src/devtoolsFixtures.test.ts packages/devtools-protocol/src/Fixtures.ts` passed with 0 warnings and 0 errors.
  - FORMAT: `pnpm exec oxfmt --check packages/storybook/src/devtoolsFixtures.ts packages/storybook/src/devtoolsFixtures.test.ts packages/devtools-protocol/src/Fixtures.ts` passed.
  - BOUNDARY: `rg -n "\\bchrome\\.|from \"@typed/(?:devtools-runtime|compiler|template|fx|navigation|app)|from '@typed/(?:devtools-runtime|compiler|template|fx|navigation|app)'" packages/storybook/src/devtoolsFixtures.ts packages/storybook/src/devtoolsFixtures.test.ts` returned no matches.
- commit:
  - `94581b2 feat(storybook): add host-neutral devtools fixtures`
- context_updates:
  - Added protocol-owned Storybook runtime stream fixtures under `DevtoolsProtocolFixtures.storybook`.
  - Added host-neutral Storybook view-model helpers for components, Fx, RefSubject, HMR, and replay state.
  - Exported the fixture helper from `@typed/storybook` and added `@typed/devtools-protocol` as a direct runtime dependency.
- memory_updates:
  - Storybook DevTools fixtures must consume protocol-owned runtime facts and avoid Chrome/devtools-runtime/compiler/template/app imports.

### T26 - Final Validation

- task_id: T26
- requirement_ids: FR-1 through FR-45, NFR-1 through NFR-18, AC-1 through AC-14
- ts_scenarios: TS-1 through TS-12
- routing_decision:
  - direct validation because all plan implementation tasks were already committed and remaining work was command execution plus evidence capture.
  - subagent review was not launched because the available Codex subagent tool only permits spawning on explicit user request for agents; record direct evidence instead.
- validation_evidence:
  - GREEN: `pnpm --filter @typed/devtools-protocol test` passed with 4 files and 25 tests.
  - GREEN: `pnpm --filter @typed/devtools-runtime test` passed with 9 files and 48 tests.
  - GREEN: `pnpm --filter @typed/devtools-chrome test` passed with 5 files and 27 tests.
  - GREEN: `pnpm --filter @typed/compiler test` passed with 33 files and 169 tests.
  - GREEN: `pnpm --filter @typed/template test` passed with 10 files and 178 tests.
  - GREEN: `pnpm --filter @typed/fx test` passed with 39 files, 288 passed tests, and 1 skipped test.
  - GREEN: initial `pnpm --filter @typed/app test` passed with 32 files, 426 tests, and no type errors.
  - RED: initial `pnpm build` failed in `examples/realworld` because generated `typed:server` still required `BrowserAuth`; `src/.server.dependencies.ts` did not provide a server-safe auth layer for SSR route rendering.
  - GREEN: after adding a server-safe `BrowserAuth` layer in `examples/realworld/src/.server.dependencies.ts`, `pnpm --filter typed-realworld build` passed.
  - RED: rerun `pnpm build` then failed in dirty `packages/app/src/resumability.ts` because `dispatchAction` returned an action handler with environment `unknown` while its signature declared environment `never`.
  - GREEN: after widening `dispatchAction` to `Effect.Effect<unknown, unknown, unknown>`, `pnpm --filter @typed/app build` passed.
  - GREEN: `pnpm exec oxfmt --check packages/app/src/resumability.ts examples/realworld/src/.server.dependencies.ts` passed.
  - GREEN: `pnpm exec oxlint packages/app/src/resumability.ts examples/realworld/src/.server.dependencies.ts` passed with 0 warnings and 0 errors.
  - GREEN: final `pnpm build` passed, including package builds, examples, root `tsc -b tsconfig.build.json`, and `@typed/virtual-modules-ts-plugin` plugin builds.
  - GREEN: final `git diff --check` passed.
  - GREEN: final `pnpm --filter @typed/app test` passed with 32 files, 428 tests, and no type errors after the resumability type fix.
- commit:
  - `test(devtools): record final validation evidence`
  - note: `packages/app/src/resumability.ts` remains untracked outside this workflow, but its local type fix was required for the current-worktree `pnpm build` validation.
- context_updates:
  - T25 was already committed; the stale execution-log commit marker was corrected to `94581b2`.
  - Root build required two cross-slice repairs: a server-safe realworld auth layer and a resumability environment type correction.
- memory_updates:
  - Realworld server SSR must provide a server-safe `BrowserAuth` layer when route templates include browser auth event handlers; browser-only auth belongs in `.browser.dependencies.ts`, but server rendering still needs a non-browser service value.
  - Action resume dispatch can preserve an unknown handler environment at the low-level dispatcher; only runtime bootstraps that actually satisfy the environment should narrow to `never`.

### T27 - Real Panel Tabs and Component Actions

- task_id: T27
- trigger:
  - User browser feedback reported the extension panel was placeholder UI: no real tabs and component rows were not connected to Sources or DOM inspection.
- root_cause:
  - `packages/devtools-chrome/src/panel/app.ts` rendered every protocol section at once and tab buttons had no click behavior.
  - Component rows rendered text only; there was no action model for `chrome.devtools.panels.openResource` or inspected-window DOM inspection.
  - The page bridge exposed selected-node resolution only, so panel-driven component inspection had no way to map a protocol binding id back to a mounted DOM node.
- validation_evidence:
  - RED: `pnpm --filter @typed/devtools-chrome exec vitest run src/panel/app.test.ts src/transport/inspectedWindow.test.ts` failed for missing active panel, missing component action controls, and missing inspected-window DOM action transport.
  - GREEN: `pnpm --filter @typed/devtools-runtime test` passed with 9 files and 48 tests.
  - GREEN: `pnpm --filter @typed/app exec vitest run src/runtime/devtoolsBridge.test.ts` passed with 1 file and 3 tests.
  - GREEN: `pnpm --filter @typed/devtools-chrome test` passed with 7 files and 33 tests.
  - GREEN: `pnpm --filter @typed/devtools-chrome test:browser` passed after checking active tab switching, component action buttons, Sources data, OTEL data, reload, runtime connect, and RPC messaging in Chromium with the unpacked extension.
  - GREEN: `pnpm exec oxfmt --check ...` passed for the 9 touched implementation/test files.
  - GREEN: `git diff --check` passed.
- context_updates:
  - Replaced the placeholder panel shell with active DevTools-style tabs and dense row layouts.
  - Added component DOM and Source buttons; Source routes to `chrome.devtools.panels.openResource` and DOM routes to inspected-window bridge evaluation.
  - Added `DomRegistry.resolveBindingNode` and page-side `inspectDomBinding` bridge support so binding ids can reveal mounted DOM nodes.
  - Strengthened Chromium smoke to fail if tabs or component action buttons regress back to placeholders.
- memory_updates:
  - Chrome panel protocol tabs must be real active panels with one visible body at a time; static all-section label dumps are not an acceptable DevTools UI.
  - Component rows must expose explicit DOM and Source actions, backed by protocol DOM binding resolution and Source Analyzer facts.
  - Page-side DOM bridge inspection needs a binding-id-to-node lookup in `DomRegistry`; selected-node resolution alone cannot support panel-driven component inspection.
