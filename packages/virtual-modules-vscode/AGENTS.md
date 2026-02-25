# @typed/virtual-modules-vscode

## Intent

VS Code extension that bridges **virtual module imports** (e.g. `router:./routes`, `api:./endpoints`, `virtual:foo`) with first-class editor support. Lets developers navigate, inspect, and debug virtual modules as if they were real files—without writing generated output to disk for normal use.

## Capabilities

| Capability | Mechanism |
|------------|------------|
| **Go to Definition** | `DefinitionProvider` on virtual specifiers; resolves via `@typed/virtual-modules` and opens content via `typed-virtual://` FileSystemProvider or preview on disk |
| **Document links** | Clickable virtual imports that open the resolved module |
| **Find references** | From a virtual module tab, find all files that import it |
| **Tree view** | "Virtual Module Imports" sidebar—lists discovered virtual imports per workspace folder; click to open |
| **Open from import** | Editor context menu: "Virtual Modules: Open virtual module from import" (cursor on specifier) |
| **Diagnose** | `typed.virtualModules.diagnoseDefinition` writes resolver steps to Output channel for debugging |
| **Live refresh** | Watches `onDidChangeTextDocument` / `onDidSaveTextDocument`; debounced refresh of cached virtual content |

## Architecture

- **Resolver** (`resolver.ts`): Loads plugins from `vmc.config.ts` or legacy tsconfig `compilerOptions.plugins`; builds TypeScript Program per project root for type-aware plugins; caches programs until source changes.
- **Content provision**: `virtual-module:` scheme via `TextDocumentContentProvider`; `typed-virtual:` scheme via `FileSystemProvider` (read-only). Path-based URIs survive tsserver's `toTsFilePath` (query params dropped).
- **Preview on disk** (`virtualPreviewDisk.ts`): Writes to `node_modules/.typed/virtual/` when opening from tree/command for editable inspection; content stays in sync via refresh.
- **Project root**: Uses nearest `tsconfig.json` containing the file so resolution matches the correct plugin set (e.g. sample-project in a monorepo).

## Key exports / surfaces

- Extension entry: `dist/extension.js`; contributes commands, views, menus
- Core modules: `extension.ts`, `resolver.ts`, `VirtualModuleProvider.ts`, `TypedVirtualFileSystemProvider.ts`, `VirtualModulesTreeProvider.ts`
- Dependencies: `@typed/virtual-modules`
- Peer: `typescript` (>=5)

## Constraints

- Run from workspace via launch config; do not install broken marketplace copy
- Monorepo governance: `.cursor/rules/monorepo-governance.mdc`
- Activation: `onLanguage:typescript`, `onLanguage:typescriptreact` (JS definition/link providers registered but extension may not activate on pure-JS workspaces)
- Plugin config: prefers `vmc.config.ts`; fallback to tsconfig `compilerOptions.plugins` with `@typed/virtual-modules-ts-plugin`

## Pointers

- README for run/debug and command reference
- Parent: `@typed/virtual-modules` (PluginManager, TypeInfoApi, loadResolverFromVmcConfig)
- Root AGENTS.md for bootup/modes
