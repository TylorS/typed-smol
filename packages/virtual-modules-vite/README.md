# @typed/virtual-modules-vite

Vite plugin that integrates [@typed/virtual-modules](https://github.com/typed-smol/typed-smol/tree/main/packages/virtual-modules) for virtual module resolution and loading in both dev and build.

## Install

```bash
pnpm add @typed/virtual-modules @typed/virtual-modules-vite
```

Peer: `vite` (>=5).

## Usage

1. Create a resolver (e.g. `PluginManager`) and register your virtual module plugins.
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

Optional: pass `createTypeInfoApiSession` when your plugins use the TypeInfo API (e.g. for type-aware code generation). See @typed/virtual-modules for session factory APIs.

## API

- **`virtualModulesVitePlugin(options)`** – Returns a Vite plugin.
  - `options.resolver` – `VirtualModuleResolver` (e.g. `PluginManager`).
  - `options.createTypeInfoApiSession` – Optional session factory for TypeInfo.
  - `options.warnOnError` – Log resolution/load errors to console (default `true`).

The plugin uses `enforce: "pre"` so virtual resolution runs before other resolvers.
