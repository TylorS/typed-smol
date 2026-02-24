# HttpApi VM: AST Pipeline Gate

**Rule**: For virtual module plugins, do not accept "placeholder build" completion when AST/discovery helpers exist but are not wired. `build()` must execute the parse-to-AST boundary before emission.
**Scope**: HttpApi virtual module plugin build pipeline quality gate (not resolver/bootstrap policy).

## Why

- A placeholder-only `build()` created a quality gap: tests passed, but must-have requirements (AST usage, diagnostics from file-role matrix, deterministic orchestration) remained unmet.
- This caused user-visible mismatch ("implementation feels shallow") even with green CI.

## Minimum gate for "not shallow"

1. `api.directory(...)` snapshots are converted to normalized relative paths.
2. Paths are classified through the file-role matrix.
3. A descriptor tree AST is built from those roles.
4. AST diagnostics are surfaced as structured plugin diagnostics (errors or warnings by policy).
5. Leaf nodes drive `api.file(..., { watch: true })` registration for granular invalidation.
6. Emission consumes AST-derived facts (even if final renderer is still incremental).

## Evidence

- Workflow: `.docs/workflows/20260223-0043-httpapi-virtual-module-design/memory/20260223-self-improvement-loop.md`
- Modified orchestration: `packages/app/src/HttpApiVirtualModulePlugin.ts`
- Validation: `pnpm --filter @typed/app test`, `pnpm --filter @typed/app build`, `pnpm exec tsc -b`
- See also: `.docs/_meta/memory/virtual-modules-shared-resolver-bootstrap.md`
