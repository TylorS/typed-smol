## What Changed

- Added shared bootstrap utilities in `packages/virtual-modules/src/VmcResolverLoader.ts`:
  - `loadPluginsFromEntries(...)`
  - `loadResolverFromVmcConfig(...)`
- Exported the new shared utilities from `packages/virtual-modules/src/index.ts`.
- Migrated consumers to shared bootstrap:
  - `packages/virtual-modules-compiler/src/resolverLoader.ts`
  - `packages/virtual-modules-ts-plugin/src/plugin.ts`
  - `packages/virtual-modules-vscode/src/resolver.ts`
- Preserved consumer-specific policy behavior while centralizing bootstrap mechanics:
  - compiler remains fatal on plugin-load errors,
  - ts-plugin logs plugin-load errors and continues when possible,
  - VS Code keeps legacy tsconfig plugin-specifier fallback.
- Added `packages/virtual-modules/src/VmcResolverLoader.test.ts` to lock shared loader behavior.

## Validation Performed

- `pnpm --filter @typed/virtual-modules test` (pass, 50/50 tests)
- `pnpm --filter @typed/virtual-modules-compiler test` (pass, 3/3 tests)
- `pnpm --filter @typed/virtual-modules-ts-plugin test` (pass, 6/6 tests)
- `pnpm --filter @typed/virtual-modules-vscode build` (pass)
- `ReadLints` on all touched implementation files (no diagnostics)

## Known Residual Risks

- `virtual-modules-vscode` still lacks package-local resolver unit tests; behavior is currently covered via build + neighboring integration tests.
- No interactive VS Code extension runtime session was executed in this run; manual F5 validation in sample project is still recommended.

## Follow-up Recommendations

- Add focused unit tests for `createResolver` in `virtual-modules-vscode` to lock vmc-first + legacy fallback precedence.
- Manually verify in VS Code with `packages/virtual-modules-ts-plugin/sample-project` that `router:routes` and `virtual:*` imports resolve using `vmc.config.ts` plugin entries.
- Apply the same shared bootstrap utility in any future `virtual-modules-*` integration package to avoid reintroducing drift.

## Workflow Ownership Outcome

- active_workflow_slug: `20260222-2230-vscode-esm-plugin-loading`
- explicit_reuse_override: false

## Memory Outcomes

- captured_short_term:
  - `.docs/workflows/20260222-2230-vscode-esm-plugin-loading/memory/inbox.md`
  - `.docs/workflows/20260222-2230-vscode-esm-plugin-loading/memory/episodes.md`
  - `.docs/workflows/20260222-2230-vscode-esm-plugin-loading/memory/reflections.md`
  - `.docs/workflows/20260222-2230-vscode-esm-plugin-loading/memory/promotion-candidates.md`
- promoted_long_term:
  - `.docs/_meta/memory/virtual-modules-shared-resolver-bootstrap.md`
- deferred:
  - no additional promotion candidates; current durable insight promoted.
  - semantic search evidence checked in `.docs/adrs/`, `.docs/specs/`, `.docs/workflows/`, and `.docs/_meta/memory/` before promotion.

## Cohesion Check

- Shared bootstrap concept now has one durable definition location in `.docs/_meta/memory/virtual-modules-shared-resolver-bootstrap.md`.
- New cross-file references added during this run resolve to existing files.
- Documentation routing maintained: transient run records were written only under `.docs/workflows/...`.
- Core terminology usage remains aligned with existing virtual-modules spec terms.

## Self-Improvement Loop

- observed_friction:
  - Resolver/bootstrap logic drifted across packages after vmc config migration.
- diagnosed_root_cause:
  - Shared bootstrap behavior existed conceptually but was reimplemented independently in each integration package.
- improvements:
  - Introduced a canonical shared bootstrap utility in `@typed/virtual-modules`.
  - Migrated compiler, ts-plugin, and VS Code integration code paths to the shared utility.
- validation_of_improvement:
  - Core and dependent package tests/builds passed after migration.
- consolidated:
  - Adopt a standard: bootstrap mechanics live in core package; consumers only define policy handling.
- applied_next_step:
  - Promoted the reusable pattern to long-term memory for future integration work.
