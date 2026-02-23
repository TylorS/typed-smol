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

## How it works

`vmc` parses the same command-line arguments as `tsc` via `ts.parseCommandLine`, then:

1. Creates a standard `CompilerHost` with `ts.createCompilerHost`
2. Wraps it with `attachCompilerHostAdapter` from `@typed/virtual-modules`
3. Runs the compilation (single-shot, watch, or build) using the adapted host

Virtual modules resolved by your plugins are injected into the compilation graph and type-checked alongside real files.
