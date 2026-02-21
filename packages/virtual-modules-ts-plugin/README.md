# @typed/virtual-modules-ts-plugin

TypeScript Language Service plugin that integrates [@typed/virtual-modules](../virtual-modules) for virtual module resolution in editors (VS Code, etc.).

## Installation

```bash
pnpm add -D @typed/virtual-modules-ts-plugin
```

## Configuration

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "name": "@typed/virtual-modules-ts-plugin",
        "plugins": ["./virtual/foo.cjs"],
        "debounceMs": 50
      }
    ]
  }
}
```

### Config options

| Option       | Type       | Default | Description                                                                                                            |
| ------------ | ---------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `plugins`    | `string[]` | `[]`    | Specifiers (paths or package names) for virtual module plugins. Loaded from project root via `NodeModulePluginLoader`. |
| `debounceMs` | `number`   | `50`    | Debounce rapid watch events (ms).                                                                                      |

## Plugin format

Each plugin specifier must resolve to a CommonJS module exporting a `VirtualModulePlugin`:

```js
// virtual/foo.cjs
module.exports = {
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
