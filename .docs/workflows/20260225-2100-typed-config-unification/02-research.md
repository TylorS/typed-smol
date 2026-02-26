# Research — `typed.config.ts` Unified Configuration

## Research Questions

1. How should `typed.config.ts` be loaded (TS transpilation mechanism)?
2. How do other frameworks make `vite.config.ts` optional?
3. What is the Vite API surface for programmatic config construction?
4. How does the existing `VmcConfigLoader` work, and can we extend it?

## Source Table

| Source | Year | Type | Confidence |
|--------|------|------|------------|
| Vite 7 `loadConfigFromFile` API (confirmed exported) | 2026 | API inspection | High |
| Astro `create-vite.ts` pattern (github.com/withastro/astro) | 2026 | Framework source | High |
| Nuxt `defineNuxtConfig` + auto-generated Vite config | 2026 | Official docs | High |
| c12 config loader (unjs/c12 v3.0.3) | 2026 | npm package | High |
| jiti TS runtime loader (unjs/jiti v2.4.2) | 2026 | npm package | High |
| Existing `VmcConfigLoader.ts` in `@typed/virtual-modules` | 2026 | Project source | High |

## Key Findings

### 1. Config Loading Mechanism

**Existing pattern** in `VmcConfigLoader.ts`:
- Uses `ts.transpileModule()` to transpile `.ts` to CJS
- Evaluates via `vm.runInThisContext` with a CJS wrapper
- Creates a local `require` scoped to the config file directory
- Already handles `default` export normalization

**Recommendation**: Extend this same pattern for `typed.config.ts`. It avoids new dependencies (no jiti/c12 needed), works in the TS plugin environment (sync, no ESM loader), and is already proven.

**Alternative**: Vite 7 exports `loadConfigFromFile` which handles TS configs, but it's async and requires the full Vite runtime — too heavy for the TS plugin which needs sync loading. The CLI can use it as an optimization, but the TS plugin must use the sync path.

### 2. Making `vite.config.ts` Optional (Astro Pattern)

Astro internally constructs a complete Vite config in `create-vite.ts`:
- Composes base Vite config with framework plugins
- Passes to `createServer(config)` or `build(config)` programmatically
- User never needs `vite.config.ts` unless they want to customize raw Vite behavior

**Our approach**: When CLI commands (`serve`, `build`, `preview`) find no `vite.config.ts`, they construct a complete `InlineConfig` from `typed.config.ts` defaults:
```
{
  configFile: false,              // disable auto-discovery
  plugins: typedVitePlugin(opts), // from typed.config.ts
  server: { ... },               // from typed.config.ts
  build: { ... },                // from typed.config.ts
}
```

When `vite.config.ts` exists, CLI passes it as `configFile` and `typedVitePlugin()` auto-reads `typed.config.ts` for its plugin options.

### 3. Config File Discovery Priority

```
1. CLI --config flag (explicit vite.config.ts path)
2. typed.config.ts in project root (auto-discovered)
3. vite.config.ts in project root (Vite's default)
4. Built-in defaults
```

For the TS plugin (replacing `vmc.config.ts`):
```
1. typed.config.ts in project root
2. Built-in defaults (no vmc.config.ts fallback)
```

### 4. Config Shape (Build-Time Only)

Per user decision, `typed.config.ts` excludes runtime config (host/port/disableListenLog). It covers:

- **VM plugin options**: router prefix, api prefix + pathPrefix
- **TypeScript config**: tsconfig path, tsconfigPaths enablement
- **Server entry**: entry file path
- **Build defaults**: outDir, target, sourcemap, minify
- **Dev server defaults**: host, port, open, cors, strictPort
- **Preview defaults**: host, port, strictPort, open
- **Plugin extras**: analyze, compression, warnOnError

### 5. Vite 7 Programmatic APIs (already used by CLI)

The CLI already wraps `createServer()`, `build()`, and `preview()` from Vite 7 in Effect. Key: `configFile: false` disables auto-discovery, and `InlineConfig` accepts everything needed.

## Implications for Requirements

- `TypedConfig` is purely build-time/tooling; no Effect runtime types.
- Config loader must be **sync** (TS plugin constraint) using `ts.transpileModule` + CJS eval.
- CLI constructs `InlineConfig` from `typed.config.ts` when no `vite.config.ts` exists, using `configFile: false`.
- `typedVitePlugin()` auto-reads `typed.config.ts` in its `config` hook (Vite plugin lifecycle).
- TS plugin reads `typed.config.ts` first, falls back to `vmc.config.ts` for migration.

## Open Risks/Unknowns

1. **Config circular dependency**: If `typed.config.ts` imports from `@typed/app` for `defineConfig`, the TS plugin loading `typed.config.ts` needs `@typed/app` available — which it already should be since it's a project dependency.
2. **Config watching**: Vite watches `vite.config.ts` for restarts. When using `typed.config.ts` as the primary config, the CLI should also watch it. Vite's `configDeps` API may help.

## Alignment Notes

- Consistent with existing `VmcConfigLoader` pattern (extend, don't replace).
- Consistent with Astro framework pattern for optional `vite.config.ts`.
- No conflicts with existing specs or ADRs.
