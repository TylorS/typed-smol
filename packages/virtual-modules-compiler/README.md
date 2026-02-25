# @typed/virtual-modules-compiler

A drop-in replacement for `tsc` that uses the custom compiler host from `@typed/virtual-modules`, enabling virtual module resolution during type-checking and compilation.

## Why vmc?

Virtual modules (e.g. `router:./routes`, `api:./endpoints`) exist at runtime via Vite or the TS plugin, but `tsc` cannot resolve them. vmc uses the same resolver so CI, `pnpm run typecheck`, and non-Vite workflows get correct type-checking and emit. A single config (`vmc.config.ts`) is shared with the TS plugin and `typedVitePlugin`.

## Installation

```bash
pnpm add @typed/virtual-modules-compiler typescript
```

## Usage

The `vmc` CLI mirrors `tsc` 100%:

```bash
# Initialize vmc.config.ts in project root
vmc init

# Single-shot compile (same as tsc)
vmc

# With options
vmc --noEmit -p tsconfig.json

# Watch mode
vmc --watch

# Build mode (project references)
vmc --build
```

### Capabilities

- Single-shot compile, `--noEmit`, `--watch`, `--build` (project references)
- `vmc init` — scaffolds `vmc.config.ts` with a starter plugin
- Inline plugins (name, shouldResolve, build)
- Plugin modules (string paths to sync ESM)
- Custom resolver
- TypeInfo API in `build(id, importer, api)` for file/directory snapshots and assignability checks
- Type target specs for structural assignability (auto-injected bootstrap file)

### `vmc init`

Creates an initial `vmc.config.ts` in the current directory with a starter plugin. Use `--force` to overwrite an existing config:

```bash
vmc init
vmc init --force
```

## Configuration

Place a `vmc.config.ts` in your project root (preferred) to configure virtual module plugins:

```ts
// vmc.config.ts
export default {
  plugins: [
    {
      name: "virtual-types",
      shouldResolve: (id) => id.startsWith("virtual:"),
      build: (id, _importer, api) => {
        // Return generated TypeScript source
        return `export type ${id.replace("virtual:", "")} = { value: string };`;
      },
    },
  ],
};
```

You can also provide plugin module specifiers (including sync ESM modules):

```ts
export default {
  plugins: ["./plugins/virtual-types.mjs"],
};
```

`vmc` plugin modules must be synchronous (no top-level await).

Or provide a custom resolver:

```ts
export default {
  resolver: myCustomResolver,
};
```

## Plugin `build` callback and TypeInfoApi

The `build(id, importer, api)` callback receives a `TypeInfoApi` instance:

- `api.file(relativePath, options)` — file snapshot with exports and imports
- `api.directory(relativeGlobs, options)` — directory snapshots
- `api.resolveExport(baseDir, filePath, exportName)` — resolve an export by name
- `api.isAssignableTo(node, targetId, projection?)` — structural assignability check

Plugins that need assignability checks (e.g. Route, Effect) should declare `typeTargetSpecs`.

## Type target specs

Plugins can export `typeTargetSpecs` for structural assignability. vmc injects a bootstrap file into the program’s `rootNames` when present so type targets resolve from the same TypeScript program.

For typed-smol apps using router and HttpApi virtual modules, use `createTypeInfoApiSessionForApp` from `@typed/app` to supply the session with router and HttpApi type targets.

## How it works

`vmc` parses the same command-line arguments as `tsc` via `ts.parseCommandLine`, then:

1. Loads the resolver and plugins from `vmc.config.ts` (or returns an empty PluginManager)
2. When `typeTargetSpecs` exist, writes a bootstrap file and adds it to `rootNames`
3. Creates a standard `CompilerHost` with `ts.createCompilerHost`
4. Wraps it with `attachCompilerHostAdapter` from `@typed/virtual-modules`
5. Runs the compilation (single-shot, watch, or build) using the adapted host

Virtual modules resolved by your plugins are injected into the compilation graph and type-checked alongside real files.

## Errors

vmc does **not** throw itself. Errors are surfaced via exit code (1) and TypeScript diagnostics. If the underlying adapter or resolver throws (e.g. invalid `projectRoot`), that may propagate uncaught. See [virtual-modules-errors-and-gotchas](../virtual-modules/.docs/virtual-modules-errors-and-gotchas.md) for full reference.

## Ecosystem

`vmc.config.ts` is shared by vmc, `@typed/virtual-modules-ts-plugin`, and `typedVitePlugin` (via `@typed/virtual-modules-vite`). The VS Code integration (`@typed/virtual-modules-vscode`) can use the same config via the `vmcConfigPath` option.

For agent-facing guidance (exports, constraints, pointers), see [AGENTS.md](./AGENTS.md).
