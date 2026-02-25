# @typed/virtual-modules-ts-plugin

TypeScript Language Service plugin that integrates [@typed/virtual-modules](../virtual-modules) into the TypeScript Language Service so editors (VS Code, Cursor, etc.) get full type-checking and IntelliSense for virtual imports such as `virtual:foo`, `router:./routes`, and `api:./endpoints`. Uses the same `vmc.config.ts` as the `vmc` CLI and Vite plugin — a single config for editor, build, and dev server.

## What this enables

- Live type-checking and IntelliSense for virtual modules in the editor
- Support for plugins that use the TypeInfo API (e.g. router route validation, HttpApi endpoint validation)
- No "Cannot find module" errors for virtual IDs when correctly configured

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

**Important:** Use the package name `@typed/virtual-modules-ts-plugin` rather than path-style names like `"../"`. Path-style names often fail to resolve when the workspace root is a monorepo parent, because tsserver loads plugins from `node_modules` using the plugin name.

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

## When the plugin can throw

The plugin may throw in these cases (see [virtual-modules-errors-and-gotchas](../virtual-modules/.docs/virtual-modules-errors-and-gotchas.md) for full reference):

- **"Program not yet available"** — When virtual module resolution runs before the TypeScript project is fully loaded (e.g. first file open, before first compile). Retry when the project is loaded.
- **Session creation failure** — When `createTypeInfoApiSession` throws (e.g. type targets cannot be resolved) and no fallback session exists. Ensure type targets are imported or use `createTypeTargetBootstrapContent`.

Sample scripts (`typecheck-with-plugin.mjs`, `verify-virtual-modules.mjs`) throw on tsconfig read failure, missing vmc config, plugin load failure, or no plugins — document as expected for CLI entry points.

## Debug log

The plugin writes diagnostic events to `/tmp/vm-ts-plugin-debug.log` when the file is writable. Use this to confirm whether the plugin loads and whether resolution runs.

- **`create`** – Plugin `create()` was called; includes `projectRoot` and `configPath`
- **`attach`** – Adapter was attached to the language service host
- **`vmc`** – vmc.config load result; includes `status`, `hasResolver`, `typeTargetSpecs` count
- **`LS:resolve`** / **`LS:resolveLiterals`** – `resolveModuleNames` / `resolveModuleNameLiterals` were invoked (resolution is using the patched host)
- **`fallbackProgram`** – Fallback program creation result

If virtual modules still show "Cannot find module" but the log shows `create` and `attach`, resolution is being invoked and the issue is likely in the resolver or vmc.config. If the log has no `create`, the plugin did not load (check plugin name and `node_modules`).
