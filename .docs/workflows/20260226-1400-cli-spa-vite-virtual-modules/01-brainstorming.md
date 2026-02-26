# Brainstorming — CLI SPA + Vite Virtual Modules

## Problem Statement

The `typed serve` command currently **requires** a server entry file (`server.ts`/`server.js`/`server.mts`). If none is found, it fails with `ServerEntryNotFoundError`. This prevents users from running a pure client-side SPA with just an `index.html` and a frontend entry point.

Additionally, there is no mechanism to:

1. Configure where `index.html` lives relative to the project root.
2. Expose the resolved `typed.config.ts` back to user code at runtime.
3. Expose the Vite dev server instance for integration with Effect's `NodeHttpServer` (the vavite pattern).
4. Integrate Vite's `transformIndexHtml` with the existing `ssrForHttp` from `@typed/ui` so SSR-rendered HTML gets proper Vite treatment (HMR client injection, plugin HTML transforms).

## Desired Outcomes

1. `typed serve` works with **no server entry** — starts a vanilla Vite SPA dev server.
2. `TypedConfig` gains an `indexHtml` field to locate `index.html`.
3. A `typed:config` virtual module exposes the resolved config at runtime.
4. A `typed:vite-dev-server` virtual module exposes the Vite `ViteDevServer` instance (dev only).
5. A new `ssrForHttpWithVite` (or similar) wrapper in `@typed/ui` integrates `transformIndexHtml` into the SSR pipeline.

## Constraints and Assumptions

- **Vite 7**: All APIs must use Vite 7 programmatic surface (`createServer`, `ViteDevServer.transformIndexHtml`).
- **Effect ecosystem**: CLI uses `effect/unstable/cli`; SSR uses Effect's HttpRouter/HttpServerResponse.
- **No vavite dependency**: Project explicitly avoids vavite; native Vite 7 APIs only.
- **Virtual module plugin architecture**: Existing pattern uses `@typed/virtual-modules` with `VirtualModulePlugin` interface and `PluginManager`. New virtual modules should follow the same pattern OR use simpler Vite-native `resolveId`/`load` hooks since `typed:config` and `typed:vite-dev-server` don't need TypeInfo.
- **SPA fallback is additive**: Server entry mode must continue working exactly as-is.

## Known Unknowns and Risks

| Unknown                                          | Risk                                       | Mitigation                                                                          |
| ------------------------------------------------ | ------------------------------------------ | ----------------------------------------------------------------------------------- |
| Can Vite dev server be exposed as a module?      | Medium — it's a runtime object, not static | Use a Vite plugin that stores the server reference and serves it via virtual module |
| `transformIndexHtml` availability in SSR context | Low — it's a standard ViteDevServer API    | Only available in dev; production uses pre-built HTML                               |
| Virtual module naming collisions                 | Low                                        | Use `typed:` prefix consistently                                                    |
| Config serialization for `typed:config`          | Low                                        | Config is a plain object; JSON-serializable                                         |

## Candidate Approaches

### Approach A: Vite-native plugin for typed: virtual modules (Recommended)

Add a new Vite plugin (inside `@typed/vite-plugin`) that handles `typed:config` and `typed:vite-dev-server` via Vite's `resolveId`/`load` hooks. These are simple static/singleton modules — no need for the full `VirtualModulePlugin` + TypeInfo machinery.

**Pros**: Simple, fast, no new packages, leverages Vite's built-in virtual module pattern (`\0` prefix).
**Cons**: Separate from the existing VM plugin architecture.

### Approach B: Extend VirtualModulePlugin for typed: modules

Register new `VirtualModulePlugin` instances for `typed:config` and `typed:vite-dev-server` through the existing `PluginManager`.

**Pros**: Consistent architecture.
**Cons**: Overkill — these modules don't need TypeInfo, file watching, or code generation. The VM system is designed for directory-scanning code generation.

### Approach C: Separate package `@typed/vite-runtime`

New package for runtime Vite integration (virtual modules + SSR wrapper).

**Pros**: Clean separation.
**Cons**: More packages to maintain; the surface is small.

## Recommendation

**Approach A** — Vite-native plugin, with refinements per user:

1. **Clients config**: Add `clients` config (not `indexHtml`) — array of frontend build directories where `*.html` files will be discovered.
2. **Plugin location**: New Vite plugin (`typed:config`, `typed:vite-dev-server`) lives in **@typed/app**; @typed/vite-plugin imports and uses it.
3. **ssrForHttp location**: Move `ssrForHttp` from `@typed/ui` into **@typed/app** so it can integrate with the vite-plugin assumptions (transformIndexHtml, clients config).

## Implementation Sketch (Refined)

### 1. `typed serve` SPA fallback (packages/cli)

- Make `resolveServerEntry` return `Option<string>` instead of failing.
- In `serve` handler: if no server entry, skip `ssrLoadModule` and just `server.listen()`.

### 2. `TypedConfig.clients` (packages/app)

- Add `clients?: string | readonly string[]` — frontend build directories where `*.html` files are found.
- Wire into Vite root/input for SPA; support multi-entry when multiple client dirs.

### 3. `typed:config` + `typed:vite-dev-server` Vite plugin (packages/app)

- New plugin `createTypedRuntimeVitePlugin()` in @typed/app.
- Resolves `typed:config` (serialized config) and `typed:vite-dev-server` (dev server reference in `configureServer`).
- @typed/vite-plugin imports and registers this plugin.

### 4. ssrForHttp moved to @typed/app (packages/app, packages/ui)

- Move `ssrForHttp` from @typed/ui → @typed/app.
- Add `ssrForHttpWithVite` (or integrate transformIndexHtml into ssrForHttp) that uses `typed:vite-dev-server` + clients config + `transformIndexHtml`.
- @typed/ui re-exports from @typed/app or deprecates in favor of @typed/app.

## Source Grounding

- consulted_specs: (none matching — this is a new capability)
- consulted_adrs: (none matching)
- consulted_workflows: `.docs/workflows/20260221-1705-router-virtual-module-brainstorm/` (reviewed for VM architecture patterns)

## Initial Memory Strategy

- **Short-term**: Capture virtual module naming conventions and SPA fallback design in workflow memory.
- **Long-term promotion**: If `typed:` prefix virtual module pattern proves reusable, promote convention to a spec.
