# Brainstorming — `typed.config.ts` Unified Configuration

## Problem Statement

Configuration for typed-smol projects is fragmented across four surfaces:

1. **`vite.config.ts`** — `typedVitePlugin(options)` with `TypedVitePluginOptions` (routerVmOptions, apiVmOptions, tsconfig, tsconfigPaths, analyze, warnOnError, compression).
2. **CLI flags** — `--config`, `--mode`, `--base`, `--logLevel`, `--entry`, plus per-command flags (host, port, open, cors, strictPort, force, outDir, target, sourcemap, minify, watch).
3. **`server.ts`** inline — `AppConfig` (disableListenLog) and `RunConfig` (host, port) are passed directly in user code.
4. **`vmc.config.ts`** — TS plugin reads plugin paths for editor IntelliSense.

Users must duplicate intent across files. CLI has no access to plugin-level options (routerVmOptions, apiVmOptions). Server entry convention (`server.ts`) is hardcoded; no declarative override. Build defaults (outDir, minify, sourcemap) live only in CLI flags with no project-level defaults.

## Desired Outcomes

- **Single source of truth**: One `typed.config.ts` declares all typed-smol-specific configuration.
- **CLI reads from config**: CLI flags override config-file defaults (flags > config > built-in defaults).
- **Vite plugin reads from config**: `typedVitePlugin()` (zero-arg) auto-discovers `typed.config.ts` and uses it.
- **TS plugin reads from config**: Replaces `vmc.config.ts` or is compatible with it.
- **Runtime config available**: App-level config (host, port, disableListenLog) accessible from `typed.config.ts`.
- **Type-safe**: Full TypeScript inference; `defineConfig()` helper with autocomplete.
- **Minimal boilerplate**: Default-heavy; projects with no special needs need only `export default defineConfig({})`.

## Constraints and Assumptions

- **Dependency direction**: `@typed/cli` → `@typed/vite-plugin` → `@typed/app` → `@typed/virtual-modules`. The config type must live in a package accessible to all consumers.
- **Vite config still exists**: `vite.config.ts` is required by Vite; `typed.config.ts` doesn't replace it, but can minimize it to `defineConfig({ plugins: typedVitePlugin() })`.
- **CLI flag precedence**: CLI flags must always win over config file values (standard CLI convention).
- **No breaking change**: Existing `typedVitePlugin(options)` must continue working. Config file is an alternative source, not a replacement for explicit options.
- **ESM-first**: Config file is `.ts`, loaded via Vite's `loadConfigFromFile` or a similar mechanism.
- **Sync config**: Config must be statically resolvable (no async, no Effect programs in the config object itself).

## Known Unknowns and Risks

| #   | Unknown                              | Risk                                                                                                 | Mitigation                                                                 |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | Config file loading mechanism        | Bundling TS config at build time requires a TS loader (Vite, tsx, jiti)                              | Use Vite's `loadConfigFromFile` or `jiti` (already available in ecosystem) |
| 2   | Where does the type live?            | `@typed/app` is deepest common dependency, but config concerns (build, server) feel higher-level     | Could create a new `@typed/config` package, or keep in `@typed/app`        |
| 3   | Overlap with `vmc.config.ts`         | TS plugin uses `vmc.config.ts` with plugin paths; unifying may break existing TS plugin setup        | Support both files with migration path                                     |
| 4   | Runtime config vs build-time config  | `AppConfig` (disableListenLog, host, port) is runtime; build/server options are build-time           | Clear sectioning in the config type; runtime section is just defaults      |
| 5   | How Vite plugin discovers the config | Zero-arg `typedVitePlugin()` needs to find and load `typed.config.ts` before Vite config is resolved | Use Vite plugin `config` hook or pre-resolve in plugin factory             |

## Candidate Approaches

### A: Config type in `@typed/app`, loader utility shared

**Structure**: `TypedConfig` interface defined in `@typed/app`. A `loadTypedConfig(root?)` utility discovers and loads `typed.config.ts`. Both CLI and Vite plugin call `loadTypedConfig`.

```
@typed/app
  └── src/config/
       ├── TypedConfig.ts        (type definition)
       ├── defineConfig.ts       (identity helper with type inference)
       └── loadTypedConfig.ts    (file discovery + loading via jiti/vite)
```

**Pros**: Single package owns the type. No new package needed. `@typed/app` is already the integration layer.
**Cons**: `@typed/app` grows in scope. Build/server defaults feel like CLI concerns, not app concerns.

### B: New `@typed/config` package

**Structure**: Standalone `@typed/config` package with `TypedConfig`, `defineConfig`, and `loadTypedConfig`. Both CLI and Vite plugin depend on it.

```
@typed/config
  └── src/
       ├── TypedConfig.ts
       ├── defineConfig.ts
       └── loadTypedConfig.ts
```

**Pros**: Clean separation. Config concerns don't pollute app logic. Easy to version independently.
**Cons**: Another package in the monorepo. Extra dependency to manage. Small scope.

### C: Config type in `@typed/vite-plugin`, extended by CLI

**Structure**: `TypedVitePluginOptions` is extended to include server/build/entry defaults. CLI reads the same config.

**Pros**: Minimal change. Vite plugin already owns most of the options.
**Cons**: CLI depends on Vite plugin (already true). Vite plugin owns non-Vite concerns. Conflates "plugin options" with "project configuration".

## Recommendation

**Approach A** — config type in `@typed/app` — is the pragmatic choice. Rationale:

1. `@typed/app` is already the integration layer that both VM plugins, the Vite plugin, and the CLI consume.
2. Adding `defineConfig` + `TypedConfig` is a natural extension of the existing `AppConfig`/`RunConfig` types already in `@typed/app`.
3. Avoids a new package for what is essentially ~3 files.
4. The config file loading utility (`loadTypedConfig`) can use `jiti` (already popular in Vite ecosystem) or dynamic import to load the TS config.
5. Future: if the config grows substantially, it can be extracted to `@typed/config` without breaking the public API (re-export from `@typed/app`).

### Proposed Config Shape

```typescript
// @typed/app — defineConfig.ts
export interface TypedConfig {
  /** Server entry file path. Default: "server.ts" */
  readonly entry?: string;

  /** Router virtual module plugin options */
  readonly router?: {
    readonly prefix?: string;
  };

  /** HttpApi virtual module plugin options */
  readonly api?: {
    readonly prefix?: string;
    readonly pathPrefix?: `/${string}`;
  };

  /** Path to tsconfig.json. Default: auto-discovered */
  readonly tsconfig?: string;

  /** Enable tsconfig path resolution. Default: true */
  readonly tsconfigPaths?: boolean | Record<string, unknown>;

  /** Dev server defaults (overridden by CLI flags) */
  readonly server?: {
    readonly host?: string;
    readonly port?: number;
    readonly open?: boolean;
    readonly cors?: boolean;
    readonly strictPort?: boolean;
  };

  /** Build defaults (overridden by CLI flags) */
  readonly build?: {
    readonly outDir?: string;
    readonly target?: string;
    readonly sourcemap?: boolean;
    readonly minify?: boolean;
  };

  /** Preview server defaults (overridden by CLI flags) */
  readonly preview?: {
    readonly host?: string;
    readonly port?: number;
    readonly strictPort?: boolean;
    readonly open?: boolean;
  };

  /** Test defaults — wraps vitest (overridden by CLI flags) */
  readonly test?: {
    readonly include?: readonly string[];
    readonly exclude?: readonly string[];
    readonly globals?: boolean;
    readonly environment?: string;
    readonly typecheck?: boolean | { readonly enabled?: boolean };
    readonly coverage?: {
      readonly provider?: "v8" | "istanbul";
      readonly include?: readonly string[];
      readonly exclude?: readonly string[];
      readonly reporter?: readonly string[];
      readonly thresholds?: {
        readonly lines?: number;
        readonly branches?: number;
        readonly functions?: number;
        readonly statements?: number;
      };
    };
    readonly reporters?: readonly string[];
  };

  /** Lint defaults — wraps oxlint (overridden by CLI flags) */
  readonly lint?: {
    readonly rules?: Readonly<Record<string, "off" | "warn" | "error">>;
    readonly categories?: Readonly<Record<string, "off" | "warn" | "error">>;
    readonly plugins?: readonly string[];
    readonly include?: readonly string[];
    readonly exclude?: readonly string[];
    readonly fix?: boolean;
  };

  /** Format defaults — wraps oxfmt (overridden by CLI flags) */
  readonly format?: {
    readonly include?: readonly string[];
    readonly exclude?: readonly string[];
    readonly printWidth?: number;
    readonly tabWidth?: number;
    readonly useTabs?: boolean;
    readonly semi?: boolean;
    readonly singleQuote?: boolean;
    readonly trailingComma?: "all" | "es5" | "none";
    readonly bracketSpacing?: boolean;
    readonly arrowParens?: "always" | "avoid";
  };

  /** Bundle analyzer. Default: false */
  readonly analyze?: boolean | { filename?: string; open?: boolean; template?: string };

  /** Brotli compression for builds. Default: true */
  readonly compression?: TypedViteCompressionOptions;

  /** Warn on virtual module resolution errors. Default: true */
  readonly warnOnError?: boolean;
}

export function defineConfig(config: TypedConfig): TypedConfig {
  return config;
}
```

### Resolution Precedence

```
CLI flags  >  typed.config.ts  >  built-in defaults
```

### Consumer Integration Points

1. **`typedVitePlugin()`** (zero-arg) calls `loadTypedConfig()` → extracts plugin options (router, api, tsconfig, tsconfigPaths, analyze, compression, warnOnError).
2. **`typedVitePlugin(explicitOptions)`** — explicit options win over config file (backward-compatible).
3. **CLI `serve`/`build`/`preview`** — loads `typed.config.ts` for server/build/preview defaults, then overlays CLI flags. When no `vite.config.ts` exists, constructs full `InlineConfig` programmatically with `configFile: false`.
4. **CLI `typed test`** — wraps vitest via `createVitest` from `vitest/node`; loads `typed.config.ts` `test` section for defaults; makes `vitest.config.ts` optional.
5. **CLI `typed lint`** — wraps oxlint; loads `typed.config.ts` `lint` section; makes `.oxlintrc.json` optional; sane TS defaults.
6. **CLI `typed format`** — wraps oxfmt; loads `typed.config.ts` `format` section; makes `.oxfmtrc.json` optional.
7. **TS plugin** — reads `typed.config.ts` exclusively for router/api prefix options. `vmc.config.ts` is removed.

## Source Grounding

- consulted_specs: `.docs/specs/virtual-modules/spec.md`, `.docs/specs/httpapi-virtual-module-plugin/spec.md`, `.docs/specs/router-virtual-module-plugin/spec.md`
- consulted_adrs: none directly relevant
- consulted_workflows: reviewed existing config patterns in `packages/vite-plugin/src/index.ts`, `packages/cli/src/shared/resolveConfig.ts`, `packages/app/src/internal/appConfigTypes.ts`

## Initial Memory Strategy

- Short-term: Capture config shape decisions and precedence rules in workflow memory.
- Promotion candidates: Final `TypedConfig` interface, `defineConfig` pattern, and resolution precedence → promote to spec when stabilized.
