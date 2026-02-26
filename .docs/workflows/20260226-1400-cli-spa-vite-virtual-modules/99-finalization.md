# Finalization — CLI SPA + Vite Virtual Modules

## What Changed

### packages/app
- **TypedConfig.clients**: Added `clients?: string | readonly string[]` for frontend build directories where `*.html` files are found.
- **createTypedRuntimeVitePlugin**: New Vite plugin exposing `typed:config` (resolved config) and `typed:vite-dev-server` (dev server reference). Lives in TypedRuntimeVitePlugin.ts.
- **ssrForHttp** moved from @typed/ui to @typed/app with optional `SsrHttpOptions`:
  - `viteDevServer?`: When provided, rendered HTML is passed through `transformIndexHtml` for HMR injection.
  - `getIndexHtmlTemplate?`: Optional function to provide index.html template with `<!--ssr-outlet-->` placeholder.
- New dependencies: @typed/fx, @typed/navigation, @typed/template, @effect/platform-node, vite (dev).

### packages/vite-plugin
- **clients** option added to TypedVitePluginOptions; passed to runtime plugin.
- **createTypedRuntimeVitePlugin** registered in typedVitePlugin().
- Passes `loadedConfig` from loadTypedConfig to runtime plugin when available.

### packages/ui
- **ssrForHttp** and **handleHttpServerError** now re-exported from @typed/app.
- Removed packages/ui/src/HttpRouter.ts.
- Added @typed/app dependency.

### packages/cli
- **resolveServerEntry**: Returns `Effect<Option<string>>` instead of failing when no server entry exists (SPA mode).
- **serve**: Only calls `ssrLoadModule` when `Option.isSome(entry)`; otherwise runs pure Vite SPA dev server.
- **build**: Skips SSR build when `Option.isNone(entry)`; SPA-only build.
- Added @typed/app dependency.

### packages/cli/shared/resolveViteConfig
- Passes `clients` from TypedConfig to plugin options.

## Validation Performed

- `pnpm build` succeeds for: app, ui, vite-plugin, virtual-modules-ts-plugin.
- CLI build fails due to pre-existing errors in format.ts, lint.ts, test.ts (Effect CLI Argument API: `repeated`/`text` not found; await in non-async).
- Modified files have no lint errors (ReadLints clean).

## Known Residual Risks

1. **CLI build**: format/lint/test commands use deprecated Effect CLI APIs; blocking full CLI build.
2. **clients wiring**: TypedConfig.clients is plumbed through but not yet used to set Vite `root` or `build.rollupOptions.input` for multi-dir discovery.
3. **typed:vite-dev-server**: Uses `globalThis.__TYPED_VITE_DEV_SERVER__`; multiple Vite instances could conflict.

## Follow-up Recommendations

1. Fix Effect CLI API usage in format/lint/test (consult effect/unstable/cli docs).
2. Wire `clients` into Vite config for HTML discovery (e.g. `build.rollupOptions.input`).
3. Add integration test: `typed serve` in examples/counter (no server.ts) serves SPA.
4. Document usage: `import config from "typed:config"` and `getViteDevServer` from `typed:vite-dev-server`.

## Workflow Ownership Outcome

- active_workflow_slug: 20260226-1400-cli-spa-vite-virtual-modules
- explicit_reuse_override: false

## Memory Outcomes

- captured_short_term: clients config shape; virtual module IDs (typed:config, typed:vite-dev-server).
- promoted_long_term: (none)
- deferred: Full clients→Vite wiring; CLI format/lint/test fixes.

## Cohesion Check

- Lint/type-check: Modified files pass ReadLints.
- Single source of truth: ssrForHttp canonical in @typed/app; ui re-exports.
- Cross-file refs: All new imports resolve.

## Self-Improvement Loop

- observed_friction: CLI build blocked by unrelated format/lint/test.
- diagnosed_root_cause: Effect CLI API drift; not caused by this run.
- improvements: Isolated our changes; verified app/ui/vite-plugin build.
- consolidated: Document pre-existing CLI failures in finalization.
- applied_next_step: Recommend fixing Effect CLI usage in separate task.
