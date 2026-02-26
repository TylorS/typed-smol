# Execution Plan — `typed.config.ts`

## Subgoal DAG

```
G1: TypedConfig type + defineConfig
  └─► G2: loadTypedConfig loader
       ├─► G3: Vite plugin auto-discovery
       ├─► G4: CLI config-aware infrastructure
       │    ├─► G5: Modify serve/build/preview/run commands
       │    ├─► G6: New "typed test" command
       │    ├─► G7: New "typed lint" command
       │    └─► G8: New "typed format" command
       └─► G9: TS plugin migration (typed.config.ts replaces vmc.config.ts)
G10: Update package.json (peer deps, exports, bin)
G11: Tests
G12: Update sample project + examples
```

## Task Sequence

### Phase 1: Foundation (G1, G2)

| Task | File(s) | Depends On | FR/NFR | Risk | Validation |
|------|---------|------------|--------|------|------------|
| **T1**: Define `TypedConfig` interface | `packages/app/src/config/TypedConfig.ts` | — | FR-1, NFR-3 | Low | Compiles; `defineConfig({})` type-checks |
| **T2**: Implement `defineConfig()` | `packages/app/src/config/defineConfig.ts` | T1 | FR-1, NFR-4 | Low | Identity function returns input |
| **T3**: Implement `loadTypedConfig()` | `packages/app/src/config/loadTypedConfig.ts` | T1 | FR-2, FR-3, NFR-1 | Med | Unit tests: TS-1, TS-2, TS-3, TS-13 |
| **T4**: Export from `@typed/app` index | `packages/app/src/index.ts` | T1, T2, T3 | FR-1 | Low | Import from `@typed/app` resolves |

### Phase 2: Vite Plugin Integration (G3)

| Task | File(s) | Depends On | FR/NFR | Risk | Validation |
|------|---------|------------|--------|------|------------|
| **T5**: `typedVitePlugin()` auto-discovery | `packages/vite-plugin/src/index.ts` | T3, T4 | FR-6 | Med | TS-7, TS-8 |

### Phase 3: CLI Infrastructure (G4, G5)

| Task | File(s) | Depends On | FR/NFR | Risk | Validation |
|------|---------|------------|--------|------|------------|
| **T6**: Shared config loader in CLI | `packages/cli/src/shared/loadConfig.ts` | T3 | FR-4, FR-5 | Low | Loads config, merges with flags |
| **T7**: Optional `vite.config.ts` helper | `packages/cli/src/shared/resolveViteConfig.ts` | T5, T6 | FR-5 | Med | TS-5, TS-6 |
| **T8**: Modify `serve` command | `packages/cli/src/commands/serve.ts` | T6, T7 | FR-4, FR-5 | Low | TS-4 |
| **T9**: Modify `build` command | `packages/cli/src/commands/build.ts` | T6, T7 | FR-4, FR-5 | Low | TS-5, TS-6 |
| **T10**: Modify `preview` command | `packages/cli/src/commands/preview.ts` | T6, T7 | FR-4, FR-5 | Low | — |
| **T11**: Modify `run` command | `packages/cli/src/commands/run.ts` | T6 | FR-4 | Low | — |

### Phase 4: New CLI Commands (G6, G7, G8)

| Task | File(s) | Depends On | FR/NFR | Risk | Validation |
|------|---------|------------|--------|------|------------|
| **T12**: `typed test` command | `packages/cli/src/commands/test.ts` | T6, T7 | FR-8 | Med | TS-9, TS-10 |
| **T13**: `typed lint` command | `packages/cli/src/commands/lint.ts` | T6 | FR-9 | Med | TS-11 |
| **T14**: `typed format` command | `packages/cli/src/commands/format.ts` | T6 | FR-10 | Med | TS-12 |
| **T15**: Register new subcommands | `packages/cli/src/commands/typed.ts` | T12, T13, T14 | — | Low | CLI help shows all commands |

### Phase 5: TS Plugin (G9)

| Task | File(s) | Depends On | FR/NFR | Risk | Validation |
|------|---------|------------|--------|------|------------|
| **T16**: TS plugin reads `typed.config.ts` | `packages/virtual-modules-ts-plugin/src/plugin.ts` | T3 | FR-7 | Med | TS-9 (AC-9) |

### Phase 6: Package & Samples (G10, G12)

| Task | File(s) | Depends On | FR/NFR | Risk | Validation |
|------|---------|------------|--------|------|------------|
| **T17**: Update `@typed/cli` package.json | `packages/cli/package.json` | T12, T13, T14 | NFR-2 | Low | pnpm install succeeds |
| **T18**: Update sample project | `packages/virtual-modules-ts-plugin/sample-project/` | T16 | — | Low | `typed.config.ts` replaces `vmc.config.ts` |
| **T19**: Update counter example | `examples/counter/` | T5 | — | Low | Builds with `typed.config.ts` |

### Phase 7: Tests (G11)

| Task | File(s) | Depends On | FR/NFR | Risk | Validation |
|------|---------|------------|--------|------|------------|
| **T20**: Unit tests for `loadTypedConfig` | `packages/app/src/config/loadTypedConfig.test.ts` | T3 | TS-1,2,3,13 | Low | All pass |
| **T21**: Integration tests for CLI commands | `packages/cli/src/commands/*.integration.test.ts` | T8–T15 | TS-4–12 | Med | All pass |

## Execution Order (DAG linearized)

```
T1 → T2 → T3 → T4 → T5 → T6 → T7
                                  ├─► T8, T9, T10, T11 (parallel)
                                  ├─► T12, T13, T14 (parallel) → T15
                                  └─► T16
T17, T18, T19 (parallel, after T15 + T16)
T20, T21 (parallel, after all implementation)
```

## Replanning Triggers

- **T3 fails** (config loading): Re-examine `VmcConfigLoader` pattern; consider falling back to `jiti` if `ts.transpileModule` is insufficient.
- **T12 fails** (vitest programmatic API): Fall back to spawning `vitest` as a child process (like lint/format).
- **T13/T14 fails** (oxlint/oxfmt not available): Mark as optional; skip integration tests with clear reason.

## Rollback / Compensation

- All changes are additive (new files, new exports). Rollback = revert the commit.
- Existing `VmcConfigLoader` is not modified — only the TS plugin's call site changes.
- `typedVitePlugin(explicitOptions)` path is unchanged; auto-discovery is an additive code path.

## Mutating-Action Safeguards

- `package.json` changes: only `peerDependencies` and `bin` fields. Verify with `pnpm install` before finalizing.
- No database, deployment, or irreversible operations.

## Memory Plan

- **Short-term**: capture config loading pattern decisions and vitest/oxlint/oxfmt integration details in `workflows/20260225-2100-typed-config-unification/memory/`.
- **Promotion criteria**: If `loadTypedConfig` pattern proves reusable beyond this workflow, promote to `.docs/_meta/memory/`.
- **Recall**: reference `VmcConfigLoader` pattern from `.docs/_meta/memory/virtual-modules-shared-resolver-bootstrap.md`.
