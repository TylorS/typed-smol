# @typed/virtual-modules-compiler

## Intent

Drop-in `tsc` replacement (`vmc` CLI) that uses the custom compiler host from `@typed/virtual-modules` for virtual module resolution during type-checking and build. Enables CI, `pnpm run typecheck`, and editor-agnostic workflows where virtual modules (e.g. `router:./routes`, `api:./endpoints`) must be type-checked and compiled without Vite or the TS plugin.

## Key exports / surfaces

- **CLI** `vmc`; mirrors `tsc` args (`--noEmit`, `--watch`, `--build`); `vmc init` creates `vmc.config.ts`
- **Programmatic API**: `loadResolver`, `compile`, `runWatch`, `runBuild`, `resolveCommandLine`, `VmcConfig`, `LoadResolverResult`
- **From `@typed/virtual-modules`**: `attachCompilerHostAdapter`, `createTypeInfoApiSessionFactory`, `ensureTypeTargetBootstrapFile`
- Dependencies: `@typed/virtual-modules`, `typescript`

## Capabilities for plugins

- Plugins receive `TypeInfoApi` in `build(id, importer, api)` — `api.file()`, `api.directory()`, `api.resolveExport()`, `api.isAssignableTo()`
- Plugins can declare `typeTargetSpecs` for structural assignability (e.g. Route, Effect); vmc auto-injects a bootstrap file into `rootNames` when present

## Constraints

- Plugin modules in `vmc.config.ts` must be synchronous (no top-level await)
- Path contract (from virtual-modules): `baseDir` must be absolute; `relativePath` must not escape `baseDir`
- Plugin contract: `build()` must not trigger module resolution; re-entrancy is detected
- Config discovery: `vmc.config.ts` in project root
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`

## Pointers

- README for usage and config
- `@typed/app` — `createTypeInfoApiSessionForApp` when using router/HttpApi type targets with typed-smol apps
- Siblings: `@typed/virtual-modules-ts-plugin`, `@typed/virtual-modules-vite`, `@typed/virtual-modules-vscode` (shared `vmc.config.ts`)
- Parent: `@typed/virtual-modules`
- Root AGENTS.md for bootup/modes
