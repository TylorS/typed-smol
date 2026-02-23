# @typed/virtual-modules-ts-plugin

TypeScript Language Service plugin that integrates [@typed/virtual-modules](../virtual-modules) for virtual module resolution in editors (VS Code, etc.).

## Installation

```bash
pnpm add -D @typed/virtual-modules-ts-plugin
```

## Configuration

Define your virtual module resolver/plugins in `vmc.config.ts` (project root):

```ts
// vmc.config.ts
import { createRouterVirtualModulePlugin } from "@typed/app";

export default {
  plugins: [createRouterVirtualModulePlugin()],
};
```

Then add the TS plugin to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@typed/virtual-modules-ts-plugin",
        "debounceMs": 50
      }
    ]
  }
}
```

### Config options

| Option          | Type     | Default                             | Description                                                     |
| --------------- | -------- | ----------------------------------- | --------------------------------------------------------------- |
| `vmcConfigPath` | `string` | `"vmc.config.ts"` (auto-discovered) | Optional explicit path to vmc config, relative to project root. |
| `debounceMs`    | `number` | `50`                                | Debounce rapid watch events (ms).                               |

## Plugin format

Plugin modules referenced from `vmc.config.ts` can be synchronous ESM modules (no top-level await):

```js
// virtual/foo.mjs
export default {
  name: "foo",
  shouldResolve: (id) => id === "virtual:foo",
  build: () => "export interface Foo { n: number }",
};
```

## Local testing

### Automated tests

```bash
pnpm build && pnpm test
```

### Manual test with sample project

From the repo root:

```bash
cd packages/virtual-modules-ts-plugin
pnpm build
cd sample-project
pnpm install
```

Then open `sample-project` in VS Code (or another editor that uses tsserver). The `entry.ts` file imports `virtual:foo`; with the plugin enabled, you should get full type-checking and no diagnostics.

To test changes: rebuild the plugin, then run **TypeScript: Restart TS Server** in VS Code (Command Palette) to pick up the new build.
