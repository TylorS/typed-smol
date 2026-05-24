## Execution Summary

- workflow_slug: 20260523-1548-developer-tooling-chrome-extension
- mode: strict
- finalization_strategy: merge
- current_scope: execute approved plan task T18, then report task completion.

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
  - pending
- context_updates:
  - Added `makeOtelCorrelation` for emitting protocol `OtelSpan` runtime events through the DevTools runtime service.
  - Preserved OTEL `traceId` and `spanId` verbatim while attaching optional Typed correlation ids as metadata.
  - Reused DevTools runtime EventBus retention and bridge `otel` capability filtering.
- memory_updates:
  - Runtime OTEL correlation should preserve `traceId` and `spanId` verbatim and only attach Typed ids as additive metadata.
  - Runtime OTEL correlation should emit protocol `OtelSpan` events through `DevtoolsRuntimeService.emit` so EventBus retention and bridge capability filtering stay shared.
