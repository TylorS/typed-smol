# Testing Strategy — `typed.config.ts`

## Test Type Taxonomy

### Unit Tests

- **`loadTypedConfig()`**: discovery, loading, validation, error handling.
- **`defineConfig()`**: type inference (compile-time only, no runtime test needed).
- **Config merge logic**: CLI flags > config > defaults precedence per section.
- **Vite config construction**: `InlineConfig` assembly when `vite.config.ts` is absent.

### Integration Tests

- **CLI `serve`/`build`/`preview`**: end-to-end with a fixture project containing `typed.config.ts` and no `vite.config.ts`.
- **CLI `test`**: vitest invocation from `typed.config.ts` test section.
- **CLI `lint`**: oxlint invocation with config-driven rules.
- **CLI `format`**: oxfmt invocation with config-driven options.
- **Vite plugin zero-arg**: `typedVitePlugin()` auto-discovering config.
- **TS plugin**: loading config for VM plugin prefix resolution.

### E2E Tests

- N/A for this specification. Integration tests with fixture projects cover the user-facing flow. Browser/runtime E2E is out of scope since this is purely tooling config.

## Critical-Path Test Scenarios

| ID | Scenario | FR/NFR | AC |
|----|----------|--------|-----|
| TS-1 | `loadTypedConfig` discovers and loads valid `typed.config.ts` | FR-2, FR-3, NFR-1 | AC-2 |
| TS-2 | `loadTypedConfig` returns `not-found` when no config exists | FR-2 | AC-3 |
| TS-3 | `loadTypedConfig` returns error on syntax error in config | FR-3 | AC-2 |
| TS-4 | CLI `serve` merges config `server.port` with flag override | FR-4 | AC-4 |
| TS-5 | CLI `build` constructs `InlineConfig` with `configFile: false` when no `vite.config.ts` | FR-5 | AC-5 |
| TS-6 | CLI `build` passes through to `vite.config.ts` when it exists | FR-5, FR-11 | AC-6 |
| TS-7 | `typedVitePlugin()` zero-arg loads config for router/api/tsconfig | FR-6 | AC-7 |
| TS-8 | `typedVitePlugin(explicitOpts)` ignores config file | FR-6, FR-11 | AC-8 |
| TS-9 | `typed test` runs vitest from `typed.config.ts` test section | FR-8 | AC-12 |
| TS-10 | `typed test` defers to `vitest.config.ts` when present | FR-8, FR-11 | AC-13 |
| TS-11 | `typed lint` runs oxlint with sane defaults when no oxlint config | FR-9 | AC-15 |
| TS-12 | `typed format --check` exits non-zero on unformatted files | FR-10 | AC-19 |
| TS-13 | Config loading is fully synchronous | NFR-1 | AC-10 |

## Coverage Targets

- **Critical-path**: 100% of TS-* scenarios passing before merge.
- **Code coverage**: ≥90% line coverage for `loadTypedConfig`, config merge logic, and `InlineConfig` construction. No hard gate for CLI command integration tests (tested via TS-4 through TS-12).

## Dependency Readiness Matrix

| Dependency | Status | Unblock Action |
|------------|--------|----------------|
| `typescript` | Available | — |
| `vite` (7.x) | Available | — |
| `vitest` | Available (workspace dep) | — |
| `oxlint` | New peer dep | Add to `@typed/cli` peerDependencies |
| `oxfmt` | New peer dep | Add to `@typed/cli` peerDependencies |
| `VmcConfigLoader` pattern | Available (`@typed/virtual-modules`) | Reference implementation for `loadTypedConfig` |

## Acceptance Failure Policy

- **TS-* failure during execution**: fix immediately before continuing. Do not merge with failing critical-path scenarios.
- **Dependency incomplete** (`oxlint`/`oxfmt` not installed in CI): skip `typed lint`/`typed format` integration tests with a clear skip reason. Unblock by adding to CI setup.
