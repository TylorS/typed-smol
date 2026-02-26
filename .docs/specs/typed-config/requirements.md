# Requirements — `typed.config.ts`

## Functional Requirements

### FR-1: Config Type and Helper

`@typed/app` exports a `TypedConfig` interface and a `defineConfig(config: TypedConfig): TypedConfig` identity function. `TypedConfig` covers:

- `entry` — server entry path
- `router` — router VM plugin options (prefix)
- `api` — HttpApi VM plugin options (prefix, pathPrefix)
- `tsconfig` — path to tsconfig.json
- `tsconfigPaths` — boolean or options object
- `server` — dev server defaults (host, port, open, cors, strictPort)
- `build` — build defaults (outDir, target, sourcemap, minify)
- `preview` — preview defaults (host, port, strictPort, open)
- `test` — vitest defaults (include, exclude, globals, environment, typecheck, coverage, reporters)
- `lint` — oxlint defaults (rules, categories, plugins, include, exclude, fix)
- `format` — oxfmt defaults (include, exclude, printWidth, tabWidth, useTabs, semi, singleQuote, trailingComma, bracketSpacing, arrowParens)
- `analyze` — bundle analyzer toggle/options
- `compression` — build compression toggle/options
- `warnOnError` — virtual module error warnings

All fields are optional. An empty `defineConfig({})` is valid.

### FR-2: Config File Discovery

A `loadTypedConfig(options)` function discovers and loads the config file. Discovery order:

1. Explicit `configPath` option (if provided).
2. `typed.config.ts` in `projectRoot`.
3. Returns `{ status: "not-found" }` if no file exists.

### FR-3: Config File Loading

`loadTypedConfig` transpiles `.ts` config using `ts.transpileModule()` + CJS eval (same pattern as `VmcConfigLoader`). It normalizes `default` exports. Loading is synchronous (TS plugin constraint).

### FR-4: CLI Integration — Config as Defaults

CLI commands (`serve`, `build`, `preview`, `test`, `lint`, `format`) load `typed.config.ts` and use the corresponding section as defaults. CLI flags override config values. Precedence: **CLI flags > typed.config.ts > built-in defaults**.

### FR-5: CLI Integration — Optional `vite.config.ts`

When no `vite.config.ts` exists in the project root, CLI commands construct a complete `InlineConfig` programmatically:
- `configFile: false` (disables Vite auto-discovery)
- `plugins: typedVitePlugin(opts)` (with opts derived from `typed.config.ts`)
- `server`, `build`, `preview` sections from config + CLI flags
- All typed-smol plugins are included automatically

When `vite.config.ts` exists, current behavior is preserved (Vite loads it; user must include `typedVitePlugin()` in their config).

### FR-6: Vite Plugin Integration

`typedVitePlugin()` called with zero arguments auto-discovers `typed.config.ts` and uses its `router`, `api`, `tsconfig`, `tsconfigPaths`, `analyze`, `compression`, and `warnOnError` fields. Explicit `TypedVitePluginOptions` passed to `typedVitePlugin(opts)` take precedence over `typed.config.ts`.

### FR-7: TS Plugin Integration

The TS plugin reads `typed.config.ts` to obtain router/api prefix options. `vmc.config.ts` is no longer supported; the TS plugin uses `typed.config.ts` exclusively.

### FR-8: `typed test` Command

Wraps vitest via its programmatic Node API (`createVitest` from `vitest/node`). Behavior:

- Loads `typed.config.ts` `test` section for defaults (include, exclude, globals, environment, typecheck, coverage, reporters).
- CLI flags override config values (e.g. `--coverage`, `--watch`, `--reporter`).
- **Makes `vitest.config.ts` optional**: when no `vitest.config.ts` exists, constructs vitest config programmatically from `typed.config.ts` + Vite config (reusing the same "optional vite.config" logic from FR-5).
- When `vitest.config.ts` exists, defers to it (current vitest behavior preserved).
- Forwards positional arguments as test file filters.
- Default includes: `["src/**/*.{test,spec}.ts"]`.
- Default typecheck: `{ enabled: true }`.

### FR-9: `typed lint` Command

Wraps oxlint. Behavior:

- Loads `typed.config.ts` `lint` section for defaults (rules, categories, plugins, include, exclude, fix).
- CLI flags override config values (e.g. `--fix`, `--rule`, `--category`).
- **Makes `.oxlintrc.json` / `oxlint.config.ts` optional**: when no oxlint config exists, constructs oxlint arguments programmatically from `typed.config.ts`.
- When oxlint config exists, defers to it.
- Sane defaults for TypeScript projects:
  - Categories: `{ correctness: "warn", suspicious: "warn" }`
  - Plugins: typescript plugin enabled
  - Include: `["src/**/*.ts", "src/**/*.tsx"]`
- Forwards positional arguments as file/directory targets.

### FR-10: `typed format` Command

Wraps oxfmt. Behavior:

- Loads `typed.config.ts` `format` section for defaults (printWidth, tabWidth, useTabs, semi, singleQuote, trailingComma, bracketSpacing, arrowParens, include, exclude).
- CLI flags override config values (e.g. `--check`, `--print-width`).
- **Makes `.oxfmtrc.json` optional**: when no oxfmt config exists, constructs oxfmt arguments from `typed.config.ts`.
- When oxfmt config exists, defers to it.
- Sane defaults: Prettier-compatible defaults (oxfmt's own defaults).
- `typed format` writes formatted files; `typed format --check` checks without writing.
- Forwards positional arguments as file/directory targets.

### FR-11: Backward Compatibility

- `typedVitePlugin(explicitOptions)` continues to work without `typed.config.ts`.
- `vmc.config.ts` is **removed** — `typed.config.ts` is the sole config file. Projects using `vmc.config.ts` must migrate.
- `vitest.config.ts` continues to work when present.
- `.oxlintrc.json` / `oxlint.config.ts` continues to work when present.
- `.oxfmtrc.json` continues to work when present.
- CLI commands work without `typed.config.ts` (built-in defaults apply).

## Non-Functional Requirements

### NFR-1: Sync Loading

Config loading must be synchronous. The TS plugin runs in the TypeScript Language Service host which is fully synchronous.

### NFR-2: Minimal New Dependencies

Config loading reuses `ts.transpileModule()` + `vm.runInThisContext` (already used in `VmcConfigLoader`). New peer/optional dependencies only for the tools being wrapped:
- `vitest` — already a workspace dependency
- `oxlint` — new peer dependency for `typed lint`
- `oxfmt` — new peer dependency for `typed format`

### NFR-3: Type Safety

`TypedConfig` provides full autocomplete and type checking in editors. `defineConfig` is the recommended way to author configs.

### NFR-4: Minimal Boilerplate

A project with no special needs should work with an empty `typed.config.ts`:
```ts
import { defineConfig } from "@typed/app";
export default defineConfig({});
```
Or with no `typed.config.ts` at all (all defaults apply).

A greenfield TypeScript project needs only:
- `typed.config.ts` (optional)
- `server.ts`
- `tsconfig.json`

No `vite.config.ts`, `vitest.config.ts`, `.oxlintrc.json`, or `.oxfmtrc.json` required.

### NFR-5: Single Source of Truth

`TypedConfig` in `@typed/app` is the canonical config type. CLI, Vite plugin, and TS plugin all read the same file and type.

### NFR-6: Tool Passthrough

`typed test`, `typed lint`, and `typed format` should support passing unknown flags directly to the underlying tool. Users can always escape to the full tool API without ejecting from the CLI.

## Acceptance Criteria

| ID | Criterion | Traces To |
|----|-----------|-----------|
| AC-1 | `defineConfig({})` compiles and returns a valid `TypedConfig` | FR-1, NFR-3, NFR-4 |
| AC-2 | `loadTypedConfig({ projectRoot, ts })` discovers `typed.config.ts` and returns `{ status: "loaded", config }` | FR-2, FR-3, NFR-1 |
| AC-3 | `loadTypedConfig` returns `{ status: "not-found" }` when no config file exists | FR-2, FR-11 |
| AC-4 | CLI `serve` uses `typed.config.ts` `server.port` as default; `--port` flag overrides it | FR-4 |
| AC-5 | CLI `build` constructs full `InlineConfig` when no `vite.config.ts` exists, with `configFile: false` | FR-5 |
| AC-6 | CLI `build` preserves current behavior when `vite.config.ts` exists | FR-5, FR-11 |
| AC-7 | `typedVitePlugin()` (zero-arg) reads `typed.config.ts` for `router`, `api`, `tsconfig` options | FR-6 |
| AC-8 | `typedVitePlugin(explicitOpts)` ignores `typed.config.ts` for fields present in `explicitOpts` | FR-6, FR-11 |
| AC-9 | TS plugin reads `typed.config.ts` for router/api prefix; no `vmc.config.ts` fallback | FR-7 |
| AC-10 | Config loading is fully synchronous; no async/Promise in the load path | NFR-1 |
| AC-11 | No new npm dependencies added for config loading itself | NFR-2 |
| AC-12 | `typed test` runs vitest without `vitest.config.ts` using `typed.config.ts` `test` defaults | FR-8 |
| AC-13 | `typed test` defers to `vitest.config.ts` when present | FR-8, FR-11 |
| AC-14 | `typed test --coverage` overrides config-level coverage setting | FR-8, FR-4 |
| AC-15 | `typed lint` runs oxlint with sane TS defaults when no oxlint config exists | FR-9 |
| AC-16 | `typed lint --fix` applies auto-fixes | FR-9 |
| AC-17 | `typed lint` defers to `.oxlintrc.json` when present | FR-9, FR-11 |
| AC-18 | `typed format` formats files with oxfmt using config defaults | FR-10 |
| AC-19 | `typed format --check` exits non-zero when files are not formatted | FR-10 |
| AC-20 | `typed format` defers to `.oxfmtrc.json` when present | FR-10, FR-11 |
| AC-21 | Unknown flags are passed through to the underlying tool | NFR-6 |
