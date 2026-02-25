# @typed/virtual-modules-vite

## Intent

Vite bridge for @typed/virtual-modules: enables compile-time virtual modules that generate code on import in both dev server and build. Load this when working on the Vite integration, virtual module resolution/loading in Vite projects, or wiring router/HttpApi plugins.

## Capabilities

- **resolveId + load hooks**: Imports like `import x from "virtual:foo"` resolve and load generated source from the configured resolver.
- **PluginManager integration**: Works with `PluginManager` and any `VirtualModulePlugin` from @typed/virtual-modules.
- **TypeInfo session**: Optional `createTypeInfoApiSession` — when plugins use `api.file()` / `api.directory()` for type-aware generation, pass the session factory.
- **Encoding**: Uses `\0virtual:` + base64url to carry `(id, importer)` through Vite's resolution; avoids path-character issues.
- **Resolution order**: `enforce: "pre"` so virtual resolution runs before other resolvers.

## Key exports / surfaces

- `virtualModulesVitePlugin(options)` — `resolver`, optional `createTypeInfoApiSession`, `warnOnError`
- `encodeVirtualId`, `decodeVirtualId`, `isVirtualId` — encoding helpers (used by consumers for URL encoding in dev)
- Dependencies: `@typed/virtual-modules`
- Peer: `vite` (>=5)

## Constraints

- `importer` is required: `resolveId` returns `null` when `importer` is undefined (e.g. entry-point resolution).
- Plugin uses `enforce: "pre"` so virtual resolution runs first.
- Payload validation: decoded `id` and `importer` must not contain null bytes, be empty, or exceed 4096 chars.
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`

## Pointers

- README for usage examples and API
- Parent: `@typed/virtual-modules` for PluginManager, VirtualModulePlugin, TypeInfoApi
- Direct consumer: `@typed/vite-plugin` wires this plugin with router + HttpApi virtual modules from `@typed/app`
- Siblings: `virtual-modules-compiler`, `virtual-modules-ts-plugin`, `virtual-modules-vscode` (alternative hosts)
- Root AGENTS.md for bootup/modes
