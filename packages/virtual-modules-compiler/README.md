# @typed/virtual-modules-compiler

A drop-in replacement for `tsc` that uses the custom compiler host from `@typed/virtual-modules`, enabling virtual module resolution during type-checking and compilation.

## Installation

```bash
pnpm add @typed/virtual-modules-compiler typescript
```

## Usage

The `vmc` CLI mirrors `tsc` 100%:

```bash
# Single-shot compile (same as tsc)
vmc

# With options
vmc --noEmit -p tsconfig.json

# Watch mode
vmc --watch

# Build mode (project references)
vmc --build
```

## Configuration

Place a `vmc.config.js`, `vmc.config.mjs`, or `vmc.config.cjs` in your project root to configure virtual module plugins:

```js
// vmc.config.js
const { PluginManager } = require("@typed/virtual-modules");

module.exports = {
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

Or provide a custom resolver:

```js
module.exports = {
  resolver: myCustomResolver,
};
```

## How it works

`vmc` parses the same command-line arguments as `tsc` via `ts.parseCommandLine`, then:

1. Creates a standard `CompilerHost` with `ts.createCompilerHost`
2. Wraps it with `attachCompilerHostAdapter` from `@typed/virtual-modules`
3. Runs the compilation (single-shot, watch, or build) using the adapted host

Virtual modules resolved by your plugins are injected into the compilation graph and type-checked alongside real files.
