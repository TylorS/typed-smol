## Self-Improvement Loop: Shallow Alignment Correction

- Objective: address user feedback that the HttpApi VM implementation felt shallow and misaligned with project preferences.
- Scope: `packages/app/src/HttpApiVirtualModulePlugin.ts`, `packages/app/src/httpapi/defineApiHandler.ts`, `packages/app/src/HttpApiVirtualModulePlugin.test.ts`.

### Observe

- The plugin still emitted a placeholder without consuming the existing AST pipeline helpers.
- Existing helper modules (`httpapiFileRoles`, `httpapiDescriptorTree`) were implemented but not wired into `build()`.
- This created a mismatch with must-have FR/AC requirements for parse-to-AST and diagnostics behavior.

### Diagnose

- Root cause: implementation sequencing drift after parallelized delivery; foundation modules landed, orchestration remained TODO-only.
- Secondary cause: shallow completion criteria focused on "tests green" rather than "spec-critical pipeline connected".

### Propose

1. Wire discovery snapshots into role classification and AST building inside `build()`.
2. Register endpoint-level file watchers from AST leaves.
3. Surface AST diagnostics as plugin warnings while still returning source when valid endpoints exist.
4. Tighten `defineApiHandler` return typing to preserve inferred context generics (remove type-erasing cast).

### Validate

- `pnpm --filter @typed/app test` passed (127 tests).
- `pnpm --filter @typed/app build` passed.
- `pnpm exec tsc -b` passed.
- `ReadLints` on modified files returned no lint errors.

### Consolidate

- Keep: "foundation-first + orchestration wiring in same pass" as a required quality gate for virtual module features.
- Discard: allowing placeholder-only orchestration to pass as complete when must-have FRs require active AST pipeline use.

### Apply (next-step pattern)

- Apply the same pattern to the remaining gap: replace placeholder source emission with descriptor-backed deterministic source generation.
