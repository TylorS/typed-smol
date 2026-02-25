# @typed/virtual-modules-vite

Vite plugin that integrates [@typed/virtual-modules](../virtual-modules) for virtual module resolution and loading in both dev and build. Enables compile-time code generation—imports like `virtual:config` or `api:./routes` resolve to generated TypeScript at build time.

## Install

```bash
pnpm add @typed/virtual-modules @typed/virtual-modules-vite
```

Peer: `vite` (>=5).

## Overview

**Virtual modules** are imports that resolve to generated code at dev/build time rather than to files on disk. This plugin plugs the `@typed/virtual-modules` resolver into Vite's `resolveId` and `load` hooks, so any `VirtualModulePlugin` registered with a `PluginManager` can serve content when that module specifier is imported.

- Supports **static** virtual modules (pure code generation from id/importer).
- Supports **type-aware** virtual modules via the optional TypeInfo API (`api.file()`, `api.directory()` when `createTypeInfoApiSession` is provided).

## Usage

### Basic static virtual module

1. Create a resolver (`PluginManager`) and register your virtual module plugins.
2. Add the Vite plugin with that resolver.

```ts
import { defineConfig } from "vite";
import { PluginManager } from "@typed/virtual-modules";
import { virtualModulesVitePlugin } from "@typed/virtual-modules-vite";

const manager = new PluginManager([
  {
    name: "my-virtual",
    shouldResolve(id) {
      return id === "virtual:config";
    },
    build(id) {
      return `export const config = { env: "dev" };`;
    },
  },
]);

export default defineConfig({
  plugins: [virtualModulesVitePlugin({ resolver: manager })],
});
```

Then in app code:

```ts
import { config } from "virtual:config";
```

### Type-aware virtual modules

When plugins use the TypeInfo API (e.g. `api.file()`, `api.directory()`) for type-aware code generation, pass `createTypeInfoApiSession` so the resolver can create a session with the project's TypeScript program:

```ts
import { dirname } from "node:path";
import ts from "typescript";
import { createTypeInfoApiSession, PluginManager } from "@typed/virtual-modules";
import { virtualModulesVitePlugin } from "@typed/virtual-modules-vite";

// Build program from your project (e.g. from tsconfig)
const program = ts.createProgram(["./src/main.ts"], { /* ... */ });

const createSession = () => createTypeInfoApiSession({ ts, program });
const manager = new PluginManager([
  {
    name: "file-snapshot",
    shouldResolve(id) {
      return id === "virtual:file-snapshot";
    },
    build(_id, importer, api) {
      const baseDir = dirname(importer);
      const result = api.file("types.ts", { baseDir });
      if (!result.ok) return `export const names = [];`;
      const names = result.snapshot.exports.map((e) => e.name);
      return `export const names = ${JSON.stringify(names)};`;
    },
  },
]);

export default defineConfig({
  plugins: [
    virtualModulesVitePlugin({
      resolver: manager,
      createTypeInfoApiSession: createSession,
    }),
  ],
});
```

See [@typed/virtual-modules](../virtual-modules) for the full TypeInfo API.

### Integrating with @typed/vite-plugin

If you want router (`virtual:router`) and HttpApi (`api:./<dir>`) virtual modules without wiring this plugin manually, use [@typed/vite-plugin](../vite-plugin). It includes `virtualModulesVitePlugin` and pre-registers the router and HttpApi plugins from [@typed/app](../app):

```ts
import { defineConfig } from "vite";
import { typedVitePlugin } from "@typed/vite-plugin";

export default defineConfig({
  plugins: [
    typedVitePlugin({
      createTypeInfoApiSession: createSession, // required for router type-checking
      routerVmOptions: { /* ... */ },
      apiVmOptions: { /* ... */ }, // optional
    }),
  ],
});
```

## API

### `virtualModulesVitePlugin(options)`

Returns a Vite plugin. Uses `enforce: "pre"` so virtual resolution runs before other resolvers.

| Option | Type | Description |
|--------|------|-------------|
| `resolver` | `VirtualModuleResolver` | Resolver (e.g. `PluginManager`) that handles virtual module resolution and loading. |
| `createTypeInfoApiSession` | `CreateTypeInfoApiSession` | Optional. Session factory for TypeInfo API when plugins use `api.file()` / `api.directory()`. |
| `warnOnError` | `boolean` | Log resolution/load errors to console (default `true`). Errors include plugin name and message. |

### Encoding helpers

The plugin uses `\0virtual:` + base64url encoding to carry `(id, importer)` through Vite's resolution. Exported for consumers (e.g. URL encoding in dev):

- **`encodeVirtualId(id, importer)`** — Encode a virtual id and importer into the internal format.
- **`decodeVirtualId(resolvedId)`** — Parse an encoded id; returns `{ id, importer }` or `null` if not a virtual id.
- **`isVirtualId(resolvedId)`** — Returns `true` if the string is an encoded virtual id.

Payload validation: decoded `id` and `importer` must not contain null bytes, be empty, or exceed 4096 characters.

## Errors

The plugin does **not** throw. When resolution or load fails, `resolveId` / `load` return `null` and the import fails at build/dev (module not found). When `warnOnError` is true (default), errors are logged to `console.warn`. See [virtual-modules-errors-and-gotchas](../virtual-modules/.docs/virtual-modules-errors-and-gotchas.md) for full reference.
