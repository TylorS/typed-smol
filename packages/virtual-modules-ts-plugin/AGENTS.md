# @typed/virtual-modules-ts-plugin

## Intent

TypeScript Language Service plugin for **editor/tsserver** (VS Code, Cursor, etc.) — live type-checking and IntelliSense for virtual imports as you edit. Reads `vmc.config.ts`, attaches LanguageServiceAdapter to the LS host. Distinct from `@typed/virtual-modules-compiler` (vmc CLI), which targets build/compile.

## Capabilities

- Loads `vmc.config.ts` via `loadResolverFromVmcConfig` — same config as vmc CLI and Vite plugin
- Attaches `attachLanguageServiceAdapter` — patches `resolveModuleNames`, `resolveModuleNameLiterals`, script snapshots, `fileExists`, `readFile`, diagnostics
- Provides **TypeInfoApi session** to plugins (e.g. router, HttpApi) — `api.file()`, `api.directory()`, `api.resolveExport()`, `api.isAssignableTo()` — enables route/endpoint validation
- Fallback program creation when LS program is not yet available (project loading)
- Type target bootstrap for `assignableTo`-style specs
- Watch debouncing via config `debounceMs`
- Debug log at `/tmp/vm-ts-plugin-debug.log` when writable

## Key exports / surfaces

- CJS export: `dist/plugin.js`; configured via `tsconfig.json` plugins array
- Dependencies: `@typed/virtual-modules`
- Optional: `@typed/app` for `createRouterVirtualModulePlugin` / `createHttpApiVirtualModulePlugin`

## Constraints

- Use package name `@typed/virtual-modules-ts-plugin` in tsconfig, not path-style (monorepo resolution)
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`
- Debug log: `/tmp/vm-ts-plugin-debug.log` when writable

## Pointers

- README for config and debug
- Parent: `@typed/virtual-modules`
- Siblings: virtual-modules-compiler (CLI/build), virtual-modules-vite (Vite resolver), virtual-modules-vscode (go-to-def, tree view)
- Same `vmc.config.ts` and plugin contract as vmc and Vite
- Root AGENTS.md for bootup/modes
