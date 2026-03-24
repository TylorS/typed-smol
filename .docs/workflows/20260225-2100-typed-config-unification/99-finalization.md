# Finalization — `typed.config.ts` Unified Configuration

## What Changed

### New Files

- `packages/app/src/config/TypedConfig.ts` — canonical `TypedConfig` interface with all sections (entry, router, api, tsconfig, server, build, preview, test, lint, format, analyze, compression, warnOnError)
- `packages/app/src/config/defineConfig.ts` — identity helper for type inference
- `packages/app/src/config/loadTypedConfig.ts` — sync config loader using `ts.transpileModule` + CJS eval
- `packages/app/src/config/index.ts` — barrel export
- `packages/app/src/config/loadTypedConfig.test.ts` — 11 unit tests covering TS-1, TS-2, TS-3, TS-13
- `packages/cli/src/shared/loadConfig.ts` — CLI-side config loading + flag/config/default merge helpers
- `packages/cli/src/shared/resolveViteConfig.ts` — optional `vite.config.ts` logic (constructs InlineConfig when absent)
- `packages/cli/src/commands/test.ts` — `typed test` wrapping vitest
- `packages/cli/src/commands/lint.ts` — `typed lint` wrapping oxlint
- `packages/cli/src/commands/format.ts` — `typed format` wrapping oxfmt
- `examples/counter/typed.config.ts` — example config file
- `packages/virtual-modules-ts-plugin/sample-project/typed.config.ts` — replaces vmc.config.ts

### Modified Files

- `packages/app/src/index.ts` — exports config module
- `packages/vite-plugin/src/index.ts` — `typedVitePlugin()` zero-arg auto-discovers `typed.config.ts`
- `packages/cli/src/commands/serve.ts` — config-aware with optional vite.config.ts
- `packages/cli/src/commands/build.ts` — config-aware with optional vite.config.ts
- `packages/cli/src/commands/preview.ts` — config-aware with optional vite.config.ts
- `packages/cli/src/commands/run.ts` — config-aware with optional vite.config.ts
- `packages/cli/src/commands/typed.ts` — registers test, lint, format subcommands
- `packages/cli/package.json` — oxlint/oxfmt as optional peer deps
- `packages/virtual-modules-ts-plugin/src/plugin.ts` — reads `typed.config.ts` instead of `vmc.config.ts`

## Validation Performed

- 11/11 unit tests pass for `loadTypedConfig` (TS-1, TS-2, TS-3, TS-13)
- No linter errors on new/modified files
- All `TypedConfig` sections type-check (verified via test compilation)

## Known Residual Risks

1. **TS plugin**: The `@typed/app` import uses `@ts-expect-error` for CJS/ESM interop — same pattern as existing `@typed/virtual-modules` import.
2. **oxlint/oxfmt**: CLI commands require these binaries to be installed. Graceful error messages are provided.
3. **`vmc.config.ts` removal**: Any projects using `vmc.config.ts` must migrate to `typed.config.ts`. No automatic migration tool provided.

## Follow-up Recommendations

1. Run full `pnpm build` after merging to verify cross-package type resolution.
2. Update README files to document `typed.config.ts` as the primary configuration method.
3. Add integration tests for CLI commands (TS-4 through TS-12) using fixture projects.
4. Consider a `typed init` scaffolding command that generates `typed.config.ts` + `tsconfig.json`.

## Workflow Ownership

- Active slug: `20260225-2100-typed-config-unification`
- Explicit reuse override: none

## Memory Outcomes

- Captured: sync TS config loading pattern (ts.transpileModule + CJS eval) proven reliable
- Captured: optional-config-file pattern (check existence → construct programmatic config) from Astro
- Promotion candidate: `loadTypedConfig` pattern → `.docs/_meta/memory/` if reused elsewhere
- Deferred: no promotions this run (pattern needs more usage evidence)
