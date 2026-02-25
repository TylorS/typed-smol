# @typed/vite-plugin

## Intent

`@typed/vite-plugin` is the **one-stop Vite preset** for typed-smol. It wires tsconfig path resolution, virtual modules (`router:` and `api:` from @typed/app), optional bundle analyzer, and Brotli compression into a single plugin array. Use it as the main entry point for Vite apps in the typed-smol stack.

## Capabilities

| Area | What it provides |
|------|------------------|
| **Router VM** | `router:./path` imports → typed Matcher from convention-based route files |
| **HttpApi VM** | `api:./path` imports → typed Api + Client + OpenAPI when `apiVmOptions` is set |
| **TypeInfo session** | Structural type-checking of route and endpoint contracts when `createTypeInfoApiSession` is provided |
| **tsconfig paths** | Path alias resolution from `tsconfig.json` (enabled by default) |
| **Analyzer** | Bundle treemap at `dist/stats.html` when `ANALYZE=1` |
| **Compression** | Brotli `.br` for build output (enabled by default) |

## Key exports / surfaces

- **`typedVitePlugin(options)`** — Returns the full plugin array; use as `defineConfig({ plugins: typedVitePlugin() })`
- **`createTypedViteResolver(options)`** — Builds the virtual-module resolver (router + optional HttpApi); exported for tests or custom compositions
- Dependencies: `@typed/app`, `@typed/virtual-modules`, `@typed/virtual-modules-vite`
- Peer: `vite` (>=5)

## Architecture

Plugin order within `typedVitePlugin`: 1) tsconfig paths, 2) virtual-modules Vite plugin (with resolver), 3) bundle analyzer (when `analyze`), 4) Brotli compression. The resolver built by `createTypedViteResolver` composes plugins in fixed order: router VM first, then HttpApi VM when `apiVmOptions` is set.

## Constraints

- Router VM is always registered first; HttpApi VM is added only when `apiVmOptions` is set
- `createTypeInfoApiSession` is required for router VM type-checking in dev
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`

## Pointers

- README for options and example
- Specs: `.docs/specs/router-virtual-module-plugin/spec.md`, `.docs/specs/httpapi-virtual-module-plugin/spec.md`
- Siblings: `@typed/app`, `@typed/virtual-modules-vite`
- Root AGENTS.md for bootup/modes
