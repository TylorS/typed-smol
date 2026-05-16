# Virtual Module Artifact Store Implementation Plan

Status: approved.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first compiler-substrate tranche: a shared, persistent, manifest-backed virtual module artifact store used by Vite, vmc, the TypeScript plugin, and VS Code.

**Architecture:** Preserve `typed-virtual://` as logical identity and map it to persistent generated source and manifest files under `node_modules/.typed/virtual`. Per-artifact manifests are the cache-validity authority; a project-level index supports discovery, debugging, and explicit cleanup. Existing adapters keep host-specific resolution behavior but delegate materialization, cache validation, diagnostics, and cleanup to shared core helpers.

**Tech Stack:** TypeScript, Vitest, TypeScript compiler/language-service APIs, Vite plugin API, Node filesystem APIs, existing `@typed/virtual-modules` plugin contracts.

---

## Subgoal DAG

| subgoal_id | objective | prerequisites | risk | requirement_links | success_check |
| ---------- | --------- | ------------- | ---- | ----------------- | ------------- |
| SG-1 | Define artifact identity, path layout, manifests, index, fingerprints, atomic writes, and module-specifier rewriting in `@typed/virtual-modules`. | Approved spec. | high | FR-1..FR-8, FR-10..FR-11, NFR-1..NFR-4, NFR-7, AC-1..AC-7, AC-10..AC-11, AC-15 | Unit tests prove identity/path/manifest/fingerprint/atomic-write/import-rewrite behavior. |
| SG-2 | Integrate artifact store into core record resolution without changing plugin-facing `build(id, importer, api)`. | SG-1 | high | FR-8, FR-12, FR-13, NFR-6, NFR-8, AC-1, AC-13, AC-14 | Core adapter tests pass and plugin `build()` still sees logical ids/effective real importers. |
| SG-3 | Wire vmc/compiler-host and prove restart reuse plus diagnostics. | SG-1, SG-2 | high | FR-9, FR-13, NFR-5, NFR-8, AC-8, AC-10, AC-11, AC-14 | vmc fixture sees cache hit on unchanged inputs and fails clearly for corrupt/stale artifacts. |
| SG-4 | Wire Vite and prove cross-surface reuse with vmc. | SG-3 | high | FR-9, NFR-5, AC-8 | Vite/vmc integration fixture observes cache hit on unchanged inputs. |
| SG-5 | Wire TS plugin and VS Code normal materialization through shared core path. | SG-2, SG-3 | medium | FR-9, FR-11, NFR-6, AC-9, AC-11 | TS plugin tests pass; VS Code duplicate normal-case disk preview logic is removed or reduced to a wrapper. |
| SG-6 | Add explicit clean/prune tooling and finalize docs/memory. | SG-1..SG-5 | medium | FR-14, NFR-9, AC-12 | Clean/prune test passes; docs and workflow memory capture implementation facts. |

## Ordered Tasks

| task_id | owner | prerequisites | validation | safeguards | rollback |
| ------- | ----- | ------------- | ---------- | ---------- | -------- |
| T1 | core worker | SG-1 | `pnpm --filter @typed/virtual-modules test -- ArtifactIdentity` | Add tests before implementation; no adapter changes. | Revert new artifact identity files/tests. |
| T2 | core worker | T1 | `pnpm --filter @typed/virtual-modules test -- ArtifactManifest` | Keep manifest schema versioned and JSON-serializable. | Revert manifest files/tests. |
| T3 | core worker | T2 | `pnpm --filter @typed/virtual-modules test -- ArtifactFingerprint` | Fingerprints are deterministic; no timestamp-only validity. | Revert fingerprint helper files/tests. |
| T4 | core worker | T2, T3 | `pnpm --filter @typed/virtual-modules test -- ArtifactStore` | Use temp dirs; atomic writes only. | Revert store implementation/tests. |
| T5 | core worker | T4 | `pnpm --filter @typed/virtual-modules test -- materializeVirtualFile` | Harden source correctness before adapter migration. | Revert import rewrite helpers/tests. |
| T6 | core worker | T4, T5 | `pnpm --filter @typed/virtual-modules test -- CompilerHostAdapter LanguageServiceAdapter` | Preserve plugin API inputs; do not pass physical paths to plugins. | Revert adapter integration only. |
| T7 | vmc worker | T6 | `pnpm --filter @typed/virtual-modules-compiler test` | Compiler host is the first adapter correctness gate. | Revert vmc changes. |
| T8 | vite worker | T7 | `pnpm --filter @typed/virtual-modules-vite test` | Keep Vite encoded virtual ids; artifact store sits behind resolver/load. | Revert Vite changes. |
| T9 | integration worker | T7, T8 | targeted Vite/vmc fixture tests | Fixture must prove reuse, not only successful compile. | Revert fixture and cache-hit instrumentation. |
| T10 | ts-plugin worker | T6, T7 | `pnpm --filter @typed/virtual-modules-ts-plugin test` | Preserve current `typed.config.ts` and `vmc.config.ts` behavior unless explicitly changed later. | Revert TS plugin changes. |
| T11 | vscode worker | T6, T10 | `pnpm --filter @typed/virtual-modules-vscode build` plus core materialization tests | Do not require a live VS Code host for core proof. | Revert VS Code wrapper changes. |
| T12 | core worker | T4 | `pnpm --filter @typed/virtual-modules test -- clean` | Clean/prune only explicit API/CLI path; normal flows do not prune. | Revert clean/prune helpers/tests. |
| T13 | integration worker | T1..T12 | `pnpm -r run test` and `pnpm -r build` | Record unrelated failures separately. | Revert latest failing integration slice. |
| T14 | docs worker | T13 | `git diff --check`; docs review against spec/testing strategy | Docs reflect implementation, not speculative future app-plugin work. | Revert docs/memory updates only. |

## First Execution Batch

Phase 4 should start with T1 through T5 only. Those tasks create the core artifact-store contract and generated-source correctness layer without touching adapters. Adapter tasks start only after T1 through T5 are committed and passing.

## Implementation Task Details

### T1: Artifact Identity and Paths

**Files:**
- Create: `packages/virtual-modules/src/internal/ArtifactIdentity.ts`
- Create: `packages/virtual-modules/src/internal/ArtifactIdentity.test.ts`
- Modify: `packages/virtual-modules/src/index.ts`

- [ ] Add failing tests for logical identity preserving `typed-virtual://` and physical artifact path under `node_modules/.typed/virtual`.
- [ ] Run `pnpm --filter @typed/virtual-modules test -- ArtifactIdentity`; expected failure is missing module/export.
- [ ] Implement identity helpers:
  - `createVirtualLogicalIdentity(pluginName, virtualKey, params)`
  - `createArtifactPaths(projectRoot, logicalIdentity)`
  - `isVirtualLogicalIdentity(value)`
- [ ] Export only helper types needed by adapters.
- [ ] Run the package test command again; expected pass.
- [ ] Commit with `feat: add virtual artifact identity helpers`.

### T2: Manifest and Project Index Types

**Files:**
- Create: `packages/virtual-modules/src/internal/ArtifactManifest.ts`
- Create: `packages/virtual-modules/src/internal/ArtifactManifest.test.ts`
- Modify: `packages/virtual-modules/src/index.ts`

- [ ] Add failing tests for manifest parse/serialize, schema version checking, diagnostics/warnings storage, and project-index lookup.
- [ ] Run `pnpm --filter @typed/virtual-modules test -- ArtifactManifest`; expected failure is missing implementation.
- [ ] Implement JSON-serializable `VirtualArtifactManifest` and `VirtualArtifactIndex` types plus validation helpers.
- [ ] Include manifest fields from `.docs/specs/virtual-module-artifact-store/spec.md`.
- [ ] Run the package test command again; expected pass.
- [ ] Commit with `feat: add virtual artifact manifest schema`.

### T3: Fingerprints

**Files:**
- Create: `packages/virtual-modules/src/internal/ArtifactFingerprint.ts`
- Create: `packages/virtual-modules/src/internal/ArtifactFingerprint.test.ts`
- Modify: `packages/virtual-modules/src/index.ts`

- [ ] Add failing tests for source content hash, plugin module hash, plugin config hash, package/version metadata, TypeScript version, and parsed tsconfig hash.
- [ ] Run `pnpm --filter @typed/virtual-modules test -- ArtifactFingerprint`; expected failure is missing implementation.
- [ ] Implement deterministic hashing over normalized JSON and file contents.
- [ ] Represent unavailable fingerprints explicitly as non-reusable reasons.
- [ ] Run the package test command again; expected pass.
- [ ] Commit with `feat: add virtual artifact fingerprinting`.

### T4: Artifact Store Core

**Files:**
- Create: `packages/virtual-modules/src/internal/ArtifactStore.ts`
- Create: `packages/virtual-modules/src/internal/ArtifactStore.test.ts`
- Modify: `packages/virtual-modules/src/index.ts`

- [ ] Add failing tests for cache miss, cache hit, corrupt manifest, source hash mismatch, missing source, project-index update, restart reuse, and concurrent atomic writes.
- [ ] Run `pnpm --filter @typed/virtual-modules test -- ArtifactStore`; expected failure is missing implementation.
- [ ] Implement synchronous artifact store operations over the identity, manifest, and fingerprint helpers.
- [ ] Use write-to-temp plus rename for source, manifest, and index writes.
- [ ] Run the package test command again; expected pass.
- [ ] Commit with `feat: add virtual artifact store`.

### T5: Module Specifier Handling

**Files:**
- Modify: `packages/virtual-modules/src/internal/materializeVirtualFile.ts`
- Add or modify: `packages/virtual-modules/src/internal/materializeVirtualFile.test.ts`

- [ ] Add failing tests for static imports, re-exports, side-effect imports, and dynamic imports in generated source.
- [ ] Run `pnpm --filter @typed/virtual-modules test -- materializeVirtualFile`; expected failures for unsupported syntax.
- [ ] Replace regex-only rewriting with TypeScript-aware module-specifier handling, or explicitly document unsupported syntax if a case cannot be safely rewritten in v1.
- [ ] Run targeted tests again; expected pass.
- [ ] Commit with `fix: harden virtual artifact import rewriting`.

### T6: Core Adapter Integration

**Files:**
- Modify: `packages/virtual-modules/src/internal/VirtualRecordStore.ts`
- Modify: `packages/virtual-modules/src/CompilerHostAdapter.ts`
- Modify: `packages/virtual-modules/src/LanguageServiceAdapter.ts`
- Modify: `packages/virtual-modules/src/types.ts`
- Modify tests: `packages/virtual-modules/src/CompilerHostAdapter.test.ts`, `packages/virtual-modules/src/LanguageServiceAdapter.test.ts`

- [ ] Add failing tests proving plugin `build()` receives the original id/effective importer and not physical artifact paths.
- [ ] Add failing tests proving cache diagnostics surface through compiler/language-service diagnostics.
- [ ] Run `pnpm --filter @typed/virtual-modules test -- CompilerHostAdapter LanguageServiceAdapter`; expected failure before implementation.
- [ ] Thread an optional artifact-store instance through adapter options.
- [ ] Replace opportunistic materialization with artifact-store-backed reads/writes.
- [ ] Run the targeted adapter tests again; expected pass.
- [ ] Commit with `feat: integrate artifact store with core adapters`.

### T7: vmc Compiler-Host Integration

**Files:**
- Modify: `packages/virtual-modules-compiler/src/compile.ts`
- Modify: `packages/virtual-modules-compiler/src/watch.ts`
- Modify: `packages/virtual-modules-compiler/src/cli.integration.test.ts`

- [ ] Add failing vmc tests proving compile uses generated artifacts and restart reuse works when fingerprints match.
- [ ] Add failing watch test if adapter lifetime confirms premature disposal.
- [ ] Run `pnpm --filter @typed/virtual-modules-compiler test`; expected targeted failures.
- [ ] Wire artifact-store options into vmc compile/watch paths.
- [ ] Fix vmc watch adapter lifetime if the failing test confirms the risk.
- [ ] Run the package test command again; expected pass.
- [ ] Commit with `feat: use virtual artifact store in vmc`.

### T8: Vite Integration

**Files:**
- Modify: `packages/virtual-modules-vite/src/vitePlugin.ts`
- Modify: `packages/virtual-modules-vite/src/vitePlugin.test.ts`
- Modify: `packages/virtual-modules-vite/src/vitePlugin.integration.test.ts`

- [ ] Add failing Vite unit tests proving `load()` reads a persisted artifact hit without re-running plugin `build()` when fingerprints match.
- [ ] Add failing Vite integration coverage proving dev-server virtual module content is materialized under `node_modules/.typed/virtual` while `resolveId()` still returns the existing encoded Vite id.
- [ ] Run `pnpm --filter @typed/virtual-modules-vite test`; expected targeted failure before artifact-store wiring.
- [ ] Add `projectRoot`/artifact-store setup to the Vite plugin without changing user-facing virtual ids or Vite's encoded virtual id transport.
- [ ] Use the same core artifact-store correctness model as vmc for source roots, TypeInfo dependency descriptors, plugin/config/compiler inputs where the Vite surface has enough information; fail closed or rebuild when fingerprints are unavailable.
- [ ] Preserve nested virtual importer decoding and TypeInfo API behavior.
- [ ] Run `pnpm --filter @typed/virtual-modules-vite test`; expected pass.
- [ ] Run `pnpm --filter @typed/virtual-modules-vite build`; expected pass.
- [ ] Run targeted formatting/lint checks for changed Vite files.
- [ ] Commit with `feat: use virtual artifact store in vite`.

### T9: Cross-Surface Reuse Fixture

**Files:**
- Modify or create fixture tests in `packages/virtual-modules-vite/src/vitePlugin.integration.test.ts`
- Modify or create fixture tests in `packages/virtual-modules-compiler/src/cli.integration.test.ts`

- [ ] Add failing cross-surface fixture coverage where `vmc --noEmit` materializes `virtual:foo` for `src/main.ts`, then a Vite dev-server load for the same `virtual:foo`/importer reads the persisted source while the Vite plugin `build()` throws if it runs.
- [ ] Reuse the vmc-written manifest/index as the proof boundary: Vite supplies the manifest's plugin/compiler fingerprints explicitly and contributes the same importer source fingerprint through the Vite adapter.
- [ ] Add or tighten compiler-side fixture assertions proving vmc emits the reusable manifest fields the Vite fixture consumes: generated source path, plugin fingerprints, compiler fingerprints, and source input fingerprints.
- [ ] Run targeted Vite/vmc integration tests; expected fail before the fixture/helper wiring is complete.
- [ ] Add only minimal test helpers needed to read the artifact manifest/index; avoid public cache-hit instrumentation unless manifest/build-count proof is insufficient.
- [ ] Run `pnpm --filter @typed/virtual-modules-vite test -- vitePlugin.integration`; expected pass.
- [ ] Run `pnpm --filter @typed/virtual-modules-compiler test -- cli.integration`; expected pass.
- [ ] Run targeted formatting/lint checks for changed test files.
- [ ] Commit with `test: prove cross-surface virtual artifact reuse`.

### T10: TypeScript Plugin Integration

**Files:**
- Modify: `packages/virtual-modules-ts-plugin/src/plugin.ts`
- Modify: `packages/virtual-modules-ts-plugin/src/plugin.test.ts`
- Modify: `packages/virtual-modules-ts-plugin/src/sample-project.integration.test.ts`

- [ ] Add failing tests proving TS plugin uses shared artifact store and does not create a separate incompatible materialization path.
- [ ] Run `pnpm --filter @typed/virtual-modules-ts-plugin test`; expected targeted failure.
- [ ] Wire artifact-store options into `attachLanguageServiceAdapter` from the plugin.
- [ ] Preserve existing typed config and vmc config merging behavior.
- [ ] Run TS plugin tests again; expected pass.
- [ ] Commit with `feat: use shared virtual artifacts in ts plugin`.

### T11: VS Code Shared Materialization

**Files:**
- Modify: `packages/virtual-modules-vscode/src/virtualPreviewDisk.ts`
- Modify: `packages/virtual-modules-vscode/src/resolver.ts`
- Modify: `packages/virtual-modules-vscode/src/extension.ts`
- Add tests in `packages/virtual-modules/src/internal/ArtifactStore.test.ts` or a new core wrapper test if VS Code has no test runner.

- [x] Add core tests covering the materialization behavior VS Code needs.
- [x] Run `pnpm --filter @typed/virtual-modules test -- materializeVirtualFile`; expected pass after core support exists.
- [x] Replace VS Code's duplicate normal-case write/rewrite logic with calls into `@typed/virtual-modules`.
- [x] Run `pnpm --filter @typed/virtual-modules-vscode test`; expected pass.
- [x] Run `pnpm --filter @typed/virtual-modules-vscode build`; expected pass.
- [ ] Commit with `refactor: share vscode virtual artifact materialization`.

### T12: Explicit Clean/Prune

**Files:**
- Modify: `packages/virtual-modules/src/internal/ArtifactStore.ts`
- Modify: `packages/virtual-modules/src/internal/ArtifactStore.test.ts`
- Consider modify: `packages/virtual-modules-compiler/src/cli.ts` if clean belongs in vmc CLI for v1.

- [x] Add failing tests proving normal resolve/build/typecheck flows do not prune generated artifacts.
- [x] Add failing tests for explicit clean/prune removing artifacts and index entries.
- [x] Run focused cleanup/ArtifactStore test; expected failure before implementation.
- [x] Implement explicit clean/prune API.
- [x] Add CLI wiring only if the API alone is insufficient for AC-12.
- [x] Run targeted tests again; expected pass.
- [ ] Commit with `feat: add explicit virtual artifact cleanup`.

### T13: Full Integration Verification

**Files:**
- No planned source files unless failures reveal missing integration.

- [ ] Run `pnpm --filter @typed/virtual-modules test`.
- [ ] Run `pnpm --filter @typed/virtual-modules-vite test`.
- [ ] Run `pnpm --filter @typed/virtual-modules-compiler test`.
- [ ] Run `pnpm --filter @typed/virtual-modules-ts-plugin test`.
- [ ] Run `pnpm --filter @typed/virtual-modules-vscode build`.
- [ ] Run `pnpm -r run test`.
- [ ] Run `pnpm -r build`.
- [ ] Record exact pass/fail evidence in the workflow execution log.
- [ ] Commit only if a targeted integration fix was needed.

### T14: Docs and Memory Closeout

**Files:**
- Modify: `.docs/specs/virtual-module-artifact-store/spec.md`
- Modify: `.docs/specs/virtual-module-artifact-store/testing-strategy.md`
- Modify or create: `.docs/workflows/20260515-2018-typed-framework-evolution/memory/*`
- Modify if warranted: `.docs/_meta/memory/*`

- [ ] Update durable spec/testing strategy to match implementation details.
- [ ] Capture short-term workflow memory for manifest schema, fingerprinting, adapter integration, and test commands.
- [ ] Promote only stable reusable lessons to `.docs/_meta/memory/`.
- [ ] Run `git diff --check`.
- [ ] Commit with `docs: finalize virtual artifact store implementation notes`.

## Out of Scope For This Tranche

- Router, HTTP API, Environment, type-config, and create-app implementation.
- Remote/distributed cache.
- Async plugin hooks.
- Performance benchmarking beyond proving reduced duplicate recomputation.
- Changing `typed.config.ts` and `vmc.config.ts` compatibility behavior.

## Tactical Replanning Triggers

- If manifest schema cannot support a requirement without async plugin hooks, pause and revise the spec before implementation continues.
- If plugin fingerprints cannot be computed for preloaded plugin objects, add an explicit non-reusable fingerprint reason and revisit requirements only if this blocks built-in app plugins.
- If vmc watch adapter lifetime is worse than expected, split it into its own prerequisite task before Vite cross-surface reuse.
- If VS Code cannot directly consume core ESM helpers because of bundling/runtime constraints, keep a thin wrapper but preserve one shared core materialization implementation.
- If `pnpm -r build` fails for unrelated existing package issues, record exact failures and continue only with targeted package gates until the unrelated issue is resolved.

## Mutating-Action Safeguards

- Make one task one commit after tests pass.
- Do not change higher-level app plugin implementation in this tranche.
- Do not remove `typed-virtual://` logical identity.
- Do not add automatic pruning to normal dev/build/typecheck flows.
- Do not change config compatibility behavior in this tranche.

## Rollback / Compensation

- T1-T5 are isolated to core helpers and can be reverted as a group.
- T6 can be reverted while keeping core artifact-store helpers if adapter integration proves wrong.
- T7-T11 are adapter-specific and should be reverted per package if integration fails.
- T12 can be deferred without blocking cache correctness if explicit cleanup API scope needs revision.

## Memory Plan

- capture:
  - manifest schema decisions
  - fingerprint normalization rules
  - atomic write strategy
  - vmc watch adapter lifetime findings
  - exact validation commands and failure modes
- promotion_criteria:
  - promote only implementation-proven rules that are useful across future virtual module plugins
  - do not promote speculative framework app-plugin notes until app-plugin work starts
- recall_targets:
  - `.docs/_meta/memory/virtual-modules-shared-resolver-bootstrap.md`
  - `.docs/_meta/memory/typeinfoapi-structural-type-targets.md`
  - `.docs/_meta/memory/lint-typecheck-gate.md`
