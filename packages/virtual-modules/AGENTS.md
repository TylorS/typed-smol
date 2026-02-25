# @typed/virtual-modules

## Intent

Virtual modules are module IDs (e.g. `router:./routes`, `api:./endpoints`, `virtual:config`) that do not map to files on disk; plugins generate their content at resolution time. This package is the **core library** for synchronous, type-safe virtual module resolution across TypeScript tooling. It provides primitives for TS Language Service and CompilerHost integrations. The key differentiator is **type-aware plugin builds** via TypeInfoApi: plugins receive access to the TypeScript program (file/directory type snapshots, structural assignability checks) when generating virtual module source.

## Key exports / surfaces

- **PluginManager**, **VirtualModulePlugin** – First-match plugin resolution; plugins implement `shouldResolve(id, importer)` and `build(id, importer, api)` with sync-only `build()`.
- **TypeInfoApi**, **createTypeInfoApiSession** – Type snapshots (`api.file`, `api.directory`), `resolveExport`, `isAssignableTo` for structural checks; used by plugins during `build()`.
- **NodeModulePluginLoader** – Load plugins from disk via Node resolution (sync CJS / preloaded).
- **attachLanguageServiceAdapter**, **attachCompilerHostAdapter** – Patch TS hosts so virtual modules resolve like real files; return dispose handles.
- **VmcConfigLoader**, **VmcResolverLoader** – Load vmc.config.ts and build resolver for vmc CLI.
- Peer: `typescript` (project supplies).

## Architecture / data flow

1. Plugins implement `shouldResolve(id, importer)` and `build(id, importer, api)`; `api` is TypeInfoApi, scoped to the resolution context.
2. A resolver (`PluginManager` or custom `VirtualModuleResolver`) is passed to adapters.
3. Adapters patch the TS Language Service or CompilerHost so virtual module IDs resolve through the resolver; generated source is injected into the program.
4. Siblings consume differently: **virtual-modules-vite** (Vite plugin), **virtual-modules-compiler** (vmc CLI), **virtual-modules-ts-plugin** (LS plugin for editors), **virtual-modules-vscode** (VS Code extension), **@typed/app** (router/api plugins).

## Constraints

- **Type-target bootstrap path**: Always `projectRoot/node_modules/.typed/type-target-bootstrap.ts`. Never write to project root (e.g. `.typed/`); use node_modules so the file is git-ignored.
- **Path contract**: `baseDir` must be absolute; `relativePath` must not escape `baseDir`.
- **Plugin contract**: `build()` must not trigger module resolution; re-entrancy is detected and may surface as unresolved resolution or a diagnostic.
- Effect skill loading N/A (no Effect dependency).
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`

## Pointers

- README for API overview and purpose
- Production considerations: `packages/virtual-modules/.docs/production-readiness.md`
- Siblings for integration patterns: virtual-modules-compiler, virtual-modules-ts-plugin, virtual-modules-vite, virtual-modules-vscode
- Root AGENTS.md for bootup/modes
