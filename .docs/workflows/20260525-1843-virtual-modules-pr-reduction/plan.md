# Virtual Modules PR Reduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development for implementation. Execute task-by-task with failing tests first, review between tasks, and commit each accepted task slice.

**Goal:** Produce a reviewable PR where virtual modules, generated clients, host tooling, compiler facts, DevTools, Storybook, and RealWorld work across dev, build, preview, editor, and production-pruned surfaces.

**Architecture:** Remove misleading wrapper surfaces first, then establish the shared production closure contract and host/cache/config convergence before proving compiler, DevTools, Storybook, and RealWorld behavior. Every task owns its tests and exits with a targeted validation command plus a narrow commit.

**Tech Stack:** TypeScript, Effect HttpApi, Vite/Rollup, TypeScript language service plugin APIs, VS Code extension APIs, Storybook, Vitest, Playwright, `vmc`, Typed virtual-module artifact store.

---

## Subgoal DAG

| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| ---------- | --------- | ------------- | ---- | ----------------- | ------------- |
| SG-0 | Establish baseline and dirty-worktree guardrails. | none | medium | NFR-9, AC-16 | Current unrelated edits are documented; each task has path ownership and status checks. |
| SG-1 | Delete generated `TypedClient` wrappers and prove raw Effect client fidelity. | SG-0 | high | FR-4, FR-5, FR-6, FR-18, NFR-1, AC-4, AC-5, AC-6 | Generated source, regenerated artifacts, RealWorld, and Storybook contain no wrapper names and type-level E/R tests pass. |
| SG-2 | Add shared production dependency-closure semantics to virtual-module core and Vite build context. | SG-0 | high | FR-2, FR-3, NFR-2, AC-2, AC-3 | Closure tests prove requested exports, plugin-declared dependencies, graph reachability, and conservative fallback reasons. |
| SG-3 | Make first-party plugins conform to production-pruned output. | SG-1, SG-2 | high | FR-1, FR-2, FR-3, NFR-2, AC-1, AC-2, AC-3 | Plugin inventory has per-plugin pruning tests and no plugin emits broad production output without a documented fallback reason. |
| SG-4 | Stabilize TS plugin and VS Code on shared generated artifacts and bounded hot paths. | SG-2 | high | FR-7, FR-8, FR-9, NFR-3, NFR-4, AC-7, AC-8, AC-9 | TS plugin and VS Code tests prove shared content/fingerprints and bounded repeated hover/diagnostics/tree/preview operations. |
| SG-5 | Converge host config around `typed.config.ts`. | SG-2 | medium | FR-10, NFR-5, AC-10 | Vite, Storybook, `vmc`, TS plugin, and VS Code derive equivalent product options from Typed config with tested host-only overrides. |
| SG-6 | Prove compiler facts, template output, and stateful HMR gates. | SG-2 | high | FR-13, FR-14, FR-15, NFR-7, AC-13, AC-14, AC-15 | Compiler tests prove fact discovery, HMR accept/reject, SSR HTML equality, and DOM output operation-count threshold. |
| SG-7 | Prove live DevTools and Storybook surfaces. | SG-1, SG-4, SG-5, SG-6 | high | FR-11, FR-12, FR-16, FR-17, NFR-6, NFR-8, AC-11, AC-12 | Storybook gates use generated contracts; DevTools proves one live runtime/compiler panel path and unavailable states. |
| SG-8 | Run RealWorld and final release matrix. | SG-1 through SG-7 | high | FR-1, FR-17, NFR-6, NFR-9, AC-1, AC-16 | Targeted package gates, RealWorld gates, Storybook gates, and `pnpm build` pass from a non-stale artifact state. |

## Multi-Day Execution Strategy

This is a multi-day release-hardening plan. Do not collapse it into one uninterrupted implementation pass. Each day ends with a checkpoint note in `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/`, a narrow commit for completed work, and an explicit decision about whether the next day can proceed without replanning.

| day | focus | tasks | exit checkpoint | split decision |
| --- | ----- | ----- | --------------- | -------------- |
| Day 0 | Baseline, ownership, dirty-worktree safety | T0 | Current dirty files, generated artifact state, wrapper-name inventory, and package scripts are recorded. | If task-owned files are already dirty from another agent/human, pause and reconcile ownership before edits. |
| Day 1 | Raw HttpApi client removal and stale artifact policy | T1 | `TypedClient` wrapper names are removed from generated source paths, Storybook runtime emission, and RealWorld usage; app tests pass. | If raw client cleanup expands beyond app/storybook/RealWorld surfaces, split a raw-client PR before touching closure/core work. |
| Day 2 | Production closure core and Vite build context | T2 | Shared closure semantics exist in virtual-module core; Vite build fingerprints closure; fallback reasons are tested. | If closure API shape destabilizes plugin signatures broadly, stop and review the API before plugin migration. |
| Day 3 | First-party plugin pruning conformance | T3 | Plugin inventory is complete and each plugin has a pruning or fail-closed test. | If more than two plugins need large rewrites, split by plugin family with HttpApi/router/composable first. |
| Day 4 | Editor/host/cache and config convergence | T4, T5 | TS plugin, VS Code, Vite, Storybook, and `vmc` share generated content/config where required; hot-path counters exist. | If VS Code requires a larger architectural move, land TS plugin/Vite/cache parity first and create a follow-up VS Code PR only with approval. |
| Day 5 | Compiler, HMR, template output | T6 | Compiler facts, template baseline, DOM operation threshold, and HMR accept/reject tests pass. | If template optimization or stateful HMR is not release-ready, fail closed with diagnostics and keep the optimization/HMR gap explicit. |
| Day 6 | DevTools and Storybook live proof | T7, T8 | DevTools has one live runtime/compiler-to-panel slice or unavailable states; Storybook/RealWorld consume generated contracts. | If DevTools UI scope expands, keep only live capability proof and explicit unavailable states in this PR. |
| Day 7 | Release matrix, PR readiness, final review | T9 | Targeted gates, RealWorld gates, Storybook gates, root gates, and stale artifact scans are complete or blockers are documented. | If root gates fail outside touched packages, isolate and document rather than broadening the PR without approval. |

## Resolved Execution Decisions

- First implementation slice: raw HttpApi client cleanup first, because it removes a known unsafe public/generated surface and unblocks Storybook/RealWorld proof.
- Production dependency closure model: combined requested exports, plugin-declared internal dependencies, TypeInfo graph reachability, and route/app graph reachability.
- Stale artifact policy: clean RealWorld virtual artifacts before wrapper scans and treat stale wrapper names in regenerated artifacts as a failed gate.
- Template optimization threshold for this release: SSR HTML must match the hand baseline; DOM output must avoid runtime template parsing and use an operation count less than or equal to the checked-in hand baseline for the same fixture.
- DevTools scope: one live generated/compiler/runtime-to-panel vertical slice plus explicit unavailable states; no UI polish required before live proof.
- Storybook scope: Storybook must consume the same generated app/runtime/client contracts as apps; no parallel runtime or fixture-only release proof.
- TypeScript 7 / `tsgo`: architecture should not block future adoption, but no implementation task may depend on TS7-only APIs.
- PR split point: T1 through T6 can be a coherent hardening PR if T7/T8 would otherwise expand uncontrolled. Splitting after T6 requires explicit human approval and must leave DevTools/Storybook gaps documented.

## Stop Conditions

- Stop and ask before editing files already dirty from another human/agent if the edits overlap the current task owner paths.
- Stop after any task whose validation fails for reasons outside its owner paths; isolate the failing package before expanding scope.
- Stop if a task needs to weaken type-safety with public `any`, `unknown`, or casts to pass.
- Stop if production pruning can only pass by relying on bundler tree-shaking.
- Stop if DevTools or Storybook proof depends only on fixtures after the task claims live behavior.
- Stop if generated artifacts disagree with source output after a clean regeneration.

## Ordered Tasks

| task_id | owner | prerequisites | validation | safeguards | rollback |
| ------- | ----- | ------------- | ---------- | ---------- | -------- |
| T0 Baseline and ownership scan | swarm-orchestrator | none | `git status --short --branch`; `rg -n "TypedClient\|makeTypedClient\|TypedRawClient\|OptionalEndpoint" packages examples .docs` | Do not edit unrelated dirty files; record active dirty paths before touching code. | Docs-only correction commit if ownership scan changes plan assumptions. |
| T1 Raw HttpApi client cleanup | refactor-surgeon + test-strategist | T0 | `pnpm --filter @typed/app test -- HttpApiVirtualModulePlugin`; `pnpm --filter @typed/app build`; `rm -rf examples/realworld/node_modules/.typed/virtual && pnpm --filter typed-realworld typecheck`; `pnpm --filter typed-realworld typecheck:stories`; wrapper-name scan over source and regenerated artifacts | Touch only `packages/app/src/internal/emitHttpApiSource.ts`, `packages/app/src/HttpApiVirtualModulePlugin.ts`, related tests, Storybook runtime emission, and consuming RealWorld stories unless tests prove another path owns wrappers. | Revert only T1 edits; keep docs/other users' changes intact. |
| T2 Production closure core contract | refactor-surgeon + test-strategist | T0 | `pnpm --filter @typed/virtual-modules test`; `pnpm --filter @typed/virtual-modules-vite test`; `pnpm --filter @typed/app test` | Preserve dev-mode all-export behavior; every all-output production fallback must include a reason string. | Restore previous context type and plugin calls from T2 patch only. |
| T3 First-party plugin pruning inventory | refactor-surgeon | T1, T2 | `pnpm --filter @typed/app test`; `pnpm --filter @typed/virtual-modules-vite test`; generated-source snapshots for router, HttpApi, browser, html, config, Storybook, and composable plugin modules | Plugin-by-plugin ownership; do not introduce plugin-local closure semantics that bypass shared core. | Disable only the failing plugin's pruning mode with documented all-output fallback while preserving shared contract. |
| T4 TS plugin and VS Code shared cache stability | performance-profiler + refactor-surgeon | T2 | `pnpm --filter @typed/virtual-modules-ts-plugin test`; `pnpm --filter @typed/virtual-modules-vscode test`; `pnpm --filter @typed/virtual-modules-vscode build` | Add counters/instrumentation in test-only or private seams; VS Code caches must remain presentation-only. | Remove instrumentation-only changes if they distort production hot paths. |
| T5 Config convergence | refactor-surgeon | T2 | `pnpm --filter @typed/vite-plugin test`; `pnpm --filter @typed/app test`; `pnpm --filter @typed/storybook test`; `pnpm --filter @typed/virtual-modules-ts-plugin test` | `typed.config.ts` is canonical for product options; retained host overrides require a test and ownership reason. | Keep existing host options as compatibility adapters while shared loader changes are corrected. |
| T6 Compiler facts, template output, and HMR | test-strategist + refactor-surgeon | T2 | `pnpm --filter @typed/compiler test`; `pnpm --filter @typed/app test`; `pnpm --filter typed-realworld test:hmr:local` when local browser deps are available | Optimization threshold is fixed before implementation: SSR output equals the hand baseline; DOM output uses no runtime template parser and operation count is less than or equal to the checked-in hand baseline for the same fixture. | Fall back to diagnostic-only compiler facts for a rejected boundary rather than preserving unsafe state. |
| T7 DevTools live vertical slice | execution-operator + review-auditor | T4, T6 | `pnpm --filter @typed/devtools-protocol test`; `pnpm --filter @typed/devtools-runtime test`; `pnpm --filter @typed/devtools-chrome test`; relevant `@typed/app` runtime devtools tests | Panels may expose only live capabilities or explicit unavailable states; fixture-only evidence cannot satisfy this task. | Hide or mark unwired capabilities unavailable rather than leaving stale fixture panels. |
| T8 Storybook and RealWorld contract proof | release-finalizer + test-strategist | T1, T5, T7 | `pnpm --filter @typed/storybook storybook:build`; `pnpm --filter @typed/storybook typecheck:stories`; `pnpm --filter typed-realworld storybook:build`; `pnpm --filter typed-realworld typecheck`; `pnpm --filter typed-realworld build` | Storybook must consume generated app/runtime/client contracts; no parallel runtime or local `typed:*` shims. | Scope failing Storybook/RealWorld proof to the package that owns the generated contract before changing examples. |
| T9 Final release matrix and PR readiness | release-finalizer | T1 through T8 | `git diff --check`; targeted changed-package tests; `pnpm -r run test`; `pnpm -r build`; `pnpm build`; stale wrapper/artifact scan | Run from clean staged task commits where possible; separate external/environment blockers from repo failures. | If root recursive tests fail after target packages pass, isolate the failing package and document blocker before broad edits. |

## Detailed Task Gates

### T1 Raw HttpApi Client Cleanup

- [ ] Write failing tests in `packages/app/src/HttpApiVirtualModulePlugin.test.ts` asserting client-mode output exports raw `Client`, `makeClient`, and `makeClientWith` and excludes all wrapper names.
- [ ] Write type-level E/R channel tests using `HttpApiClient.ForApi<typeof Api, E, R>` and `HttpClient.With<E, R>`.
- [ ] Make client-safe exports explicit: `Api`, `Client`, `makeClient`, and `makeClientWith` are mandatory; `makeUrlBuilder`, `OpenApi`, and `DependenciesLayer` remain client-safe only when named-requested and tests prove they do not pull server-only implementation into the generated client surface.
- [ ] Update `packages/app/src/internal/emitHttpApiSource.ts` to remove wrapper rendering helpers.
- [ ] Update `packages/app/src/HttpApiVirtualModulePlugin.ts` client-safe export policy.
- [ ] Update `packages/app/src/internal/emitStorybookSource.ts` and RealWorld story imports to use the raw client surface.
- [ ] Clean stale RealWorld virtual artifacts before regeneration: `rm -rf examples/realworld/node_modules/.typed/virtual`.
- [ ] Scan source and regenerated artifacts for banned wrapper names:
  - `rg -n "TypedClient|TypedClientInput|TypedRawClient|makeTypedClient|makeTypedClientWith|makeTypedClientFromRaw|OptionalEndpoint" packages examples --glob '!**/node_modules/**'`
  - `rg -n "TypedClient|TypedClientInput|TypedRawClient|makeTypedClient|makeTypedClientWith|makeTypedClientFromRaw|OptionalEndpoint" examples/realworld/node_modules/.typed/virtual`
- [ ] Run targeted package and example checks, then commit.

### T2 Production Closure Core Contract

- [x] Extend `packages/virtual-modules/src/types.ts` with shared closure semantics.
- [x] Extend `packages/virtual-modules/src/importUsageAnalyzer.test.ts` and core manager tests for partial/all closure behavior.
- [x] Update `packages/virtual-modules-vite/src/vitePlugin.ts` to fingerprint closure context in build mode and preserve dev all-output mode.
- [x] Add tests for conservative all-output fallback reasons.
- [x] Run virtual-module core/Vite/app tests, then commit.

### T3 First-Party Plugin Pruning Inventory

- [ ] Inventory all first-party plugins in `packages/app/src/TypedVirtualModulePlugins.ts` and `packages/app/src/internal/composableVirtualModuleCore.ts`.
- [ ] Add one production-pruning test per plugin family.
- [ ] Update plugin emitters to consume the shared closure contract.
- [ ] Add generated-source scans for unrequested imports/helpers/handlers.
- [ ] Run app and Vite tests, then commit.

#### T3 Split Status

- [x] Split T3 after inventory because more than two first-party plugin families need pruning rewrites.
- [x] T3a: router, Storybook, env, config, and html production-pruning emitters and tests.
- [ ] T3b: HttpApi, composable plugin modules, component, browser/server, and remaining route-handler/plugin families.

### T4 TS Plugin and VS Code Shared Cache Stability

- [ ] Add TS plugin tests for repeated hover/diagnostics/definition requests and count fallback program/session creation.
- [ ] Add VS Code resolver/tree/preview tests proving shared generated content and fingerprint-driven invalidation.
- [ ] Move duplicate resolver/cache logic behind shared artifact/cache helpers where tests identify drift.
- [ ] Keep VS Code presentation caches above the shared substrate.
- [ ] Run TS plugin and VS Code tests/build, then commit.

### T5 Config Convergence

- [ ] Map current duplicate config options in `typed.config.ts`, `vite.config.ts`, `vmc.config.ts`, `.storybook/main.ts`, TS plugin options, and VS Code resolver options.
- [ ] Add tests that derive equivalent product options from `typed.config.ts`.
- [ ] Keep host-only overrides explicit and documented in tests.
- [ ] Remove duplicated option plumbing only where tests prove shared derivation.
- [ ] Run Vite/app/Storybook/TS plugin tests, then commit.

### T6 Compiler Facts, Template Output, and HMR

- [ ] Add compiler fact tests for module discovery, route/app participation, template dependencies, DevTools source correlation, and HMR eligibility/rejection.
- [ ] Add SSR HTML output tests against a checked-in hand baseline.
- [ ] Add DOM output operation-count tests against the same fixture baseline.
- [ ] Add stateful HMR tests proving state preservation only across compiler-proven stable boundaries.
- [ ] Run compiler/app/HMR tests, then commit.

### T7 DevTools Live Vertical Slice

- [ ] Add app-runtime bridge tests proving live runtime event subscription or explicit unavailable states.
- [ ] Add Chrome panel tests proving panel data comes from protocol/runtime bridge adapters, not only fixture constants.
- [ ] Keep unwired panels unavailable until real data exists.
- [ ] Run DevTools protocol/runtime/chrome/app tests, then commit.

### T8 Storybook and RealWorld Contract Proof

- [ ] Add or update Storybook gates to consume generated app/runtime/client contracts.
- [ ] Remove stale fixture-only proof from release acceptance.
- [ ] Run Storybook build/typecheck/dev smoke where available.
- [ ] Run RealWorld typecheck/build/storybook build and selected browser/HMR acceptance gates.
- [ ] Commit proof fixes.

### T9 Final Release Matrix and PR Readiness

- [ ] Run stale wrapper/artifact scan:
  - `rg -n "TypedClient|TypedClientInput|TypedRawClient|makeTypedClient|makeTypedClientWith|makeTypedClientFromRaw|OptionalEndpoint" packages examples --glob '!**/node_modules/**'`
- [ ] Run final targeted package gates from changed packages.
- [ ] Run RealWorld gates:
  - `pnpm --filter typed-realworld typecheck`
  - `pnpm --filter typed-realworld build`
  - `pnpm --filter typed-realworld test:integration`
  - `pnpm --filter typed-realworld test:ssr`
  - `pnpm --filter typed-realworld storybook:build`
- [ ] Run `pnpm -r run test`.
- [ ] Run `pnpm -r build`.
- [ ] Run `pnpm build`.
- [ ] Run `git diff --check`.
- [ ] Prepare PR summary with requirement and TS scenario mapping.

## Tactical Replanning Triggers

- A task touches files outside its owner path set.
- A failing test proves a prerequisite task is incomplete.
- A production-pruning fallback reason becomes broad enough to invalidate import precision.
- TS plugin or VS Code instrumentation shows repeated full-program work on hot paths.
- Storybook or DevTools proof depends on fixture-only data.
- RealWorld fails because generated artifacts are stale.
- Root `pnpm test` or `pnpm build` fails outside changed packages after targeted gates pass.

When triggered, replan only the affected subgoal unless the approved spec boundary changes.

## Mutating-Action Safeguards

- Before each task: run `git status --short --branch` and `git status --short -- <owned paths>`.
- Write failing tests before implementation.
- Use `apply_patch` for manual edits.
- Do not revert unrelated dirty files.
- Stage only task-owned files.
- Commit each accepted task with a conventional commit message and changelog-style body.

## Memory Plan

- capture:
  - workflow-local notes in `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/memory/`;
  - per-task evidence: failing test name, passing command, generated-output scan, and any host/cache timing counters.
- promotion_criteria:
  - promote only after implementation evidence exists;
  - durable candidates: raw HttpApi client policy, combined closure fallback rules, TS plugin/VS Code cache invariants, Storybook live-proof boundary.
- recall_targets:
  - `.docs/specs/virtual-modules-release-slice/spec.md`;
  - `.docs/specs/virtual-modules-release-slice/testing-strategy.md`;
  - `.docs/adrs/20260525-1956-virtual-module-production-closure.md`;
  - `.docs/adrs/20260525-1956-httpapi-raw-client-surface.md`;
  - prior virtual artifact store and Storybook/DevTools memory only as reference, with current code rechecked before edits.

## Approval Gate

Does `plan.md` look good?

- LGTM
- Needs sequencing/ownership revisions
- Needs validation/safeguard/rollback revisions
- Other: share custom feedback
