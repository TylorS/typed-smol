# @typed/virtual-modules

Synchronous, type-safe virtual module primitives for TypeScript Language Service and compiler-host integrations.

## Purpose

Virtual modules are module IDs that do not map to files on disk; instead, plugins generate their content when the module is resolved. Use them for type-safe generated modules (e.g. route matchers, API clients), scaffolding from file structure, or config injection. For example, `import { routes } from "router:./routes"` lets a plugin scan the routes directory and generate typed route descriptors from the file layout. This package provides the core primitives: the plugin system, type-aware code generation (via TypeInfoApi), and adapters that integrate with the TypeScript Language Service (editors) and CompilerHost (tsc, vmc).

## Install

```bash
pnpm add @typed/virtual-modules
```

Peer / dev: `typescript` (project supplies its own).

## API overview

- **PluginManager** – First-match plugin resolution; `resolveModule(id, importer)` returns resolved / unresolved / error.
- **VirtualModulePlugin** – Contract: `name`, `shouldResolve(id, importer?)`, `build(id, importer?, api)`; sync only.
- **TypeInfoApi** – `createTypeInfoApiSession({ ts, program, maxTypeDepth? })` → `api.file(relativePath, options)` returns a `FileSnapshotResult` (check `result.ok` before using `result.snapshot`); `api.directory(relativeGlobs, options)` returns type snapshots. Both support optional watch descriptors.
- **NodeModulePluginLoader** – Load plugins from disk via Node resolution (sync CJS / preloaded); `load(plugin | { modulePath, baseDir })`.
- **LanguageServiceAdapter** – `attachLanguageServiceAdapter({ ts, languageService, languageServiceHost, resolver, projectRoot, watchHost?, debounceMs? })`; patches resolution, script snapshot/version, fileExists, readFile, and diagnostics; returns a handle with `dispose()`. Adapter state is bounded by necessary files: records whose importer file no longer exists are evicted.
- **CompilerHostAdapter** – `attachCompilerHostAdapter({ ts, compilerHost, resolver, projectRoot, watchHost?, debounceMs? })`; patches resolution, getSourceFile/getSourceFileByPath, fileExists, readFile, hasInvalidatedResolutions; returns a handle with `dispose()`. Same eviction of records when the importer file no longer exists.

## Building plugins

### Plugin contract

A `VirtualModulePlugin` implements `name`, `shouldResolve(id, importer)` → `boolean`, and `build(id, importer, api)` → `VirtualModuleBuildResult` (sync only). The host (Language Service adapter, CompilerHost adapter, or Vite plugin) provides `api` (TypeInfoApi) when it supplies `createTypeInfoApiSession`; otherwise plugins receive a no-op api that returns safe defaults (`file()` → `{ ok: false }`, `directory()` → `[]`). Hosts should always supply `createTypeInfoApiSession` when plugins use the API for correct behavior. **Rule**: `build()` must not trigger module resolution—re-entrancy is detected and surfaces as diagnostics (see [Production considerations](#production-considerations)).

Minimal static plugin (no `api` usage):

```ts
const configPlugin: VirtualModulePlugin = {
  name: "config",
  shouldResolve(id) {
    return id === "virtual:config";
  },
  build() {
    return `export const env = "dev";`;
  },
};
```

### Type snapshots: `api.file()` and `api.directory()`

**`api.file(relativePath, { baseDir, watch? })`** → `FileSnapshotResult`. Always check `result.ok`; on success use `result.snapshot` (`TypeInfoFileSnapshot`: `filePath`, `exports` as `ExportedTypeInfo[]`). On failure, `result.error` is `'file-not-in-program' | 'path-escapes-base' | 'invalid-input'`. Path contract: `baseDir` must be absolute; `relativePath` must not escape it.

```ts
build(_id, importer, api) {
  const baseDir = dirname(importer);
  const result = api.file("types.ts", { baseDir });
  if (!result.ok) {
    return `export const names = [];`;
  }
  const names = result.snapshot.exports.map((e) => e.name);
  return `export const names = ${JSON.stringify(names)};`;
}
```

**`api.directory(relativeGlobs, { baseDir, recursive, watch? })`** → `readonly TypeInfoFileSnapshot[]`. Globs are relative to `baseDir` (e.g. `"*.ts"` or `["**/*.ts", "**/*.tsx"]`).

```ts
build(_id, importer, api) {
  const baseDir = dirname(importer);
  const snapshots = api.directory("*.ts", { baseDir, recursive: true });
  const paths = snapshots.map((s) => s.filePath);
  return `export const paths = ${JSON.stringify(paths)};`;
}
```

`ExportedTypeInfo` has `name`, `type` (serialized `TypeNode` tree), and optional `declarationKind`, `declarationText`, `docs`. The `type` field is used for structural checks below.

### Resolving a single export: `api.resolveExport()`

**`api.resolveExport(baseDir, filePath, exportName)`** → `ExportedTypeInfo | undefined`. Use when you know the file and need one export by name without a full snapshot.

```ts
const foo = api.resolveExport(baseDir, "./mod.ts", "foo");
```

### Structural assignability: `api.isAssignableTo()` and type targets

**`api.isAssignableTo(node, targetId, projection?)`** → `boolean`. Checks whether the type behind `node` (a serialized `TypeNode` from this API) is assignable to a pre-resolved target. Used to enforce contracts (e.g. "handler return type must be Effect").

**TypeProjectionStep** (optional third arg): `{ kind: "returnType" }`, `{ kind: "param", index }`, `{ kind: "typeArg", index }`, `{ kind: "property", name }` to navigate to a sub-type.

Assignability only works when the host creates the TypeInfo session with **type targets**:

- **typeTargetSpecs**: `{ id, module, exportName, typeMember? }`. Host resolves from the program; module specifier must match user imports exactly.
- **typeTargets**: pre-resolved `{ id, type: ts.Type }`.

Plugins that need assignability declare `typeTargetSpecs` on the plugin; the host merges them (e.g. via `collectTypeTargetSpecs`) and passes them into `createTypeInfoApiSession`. If the program does not import the target modules, use `createTypeTargetBootstrapContent(typeTargetSpecs)` and include the generated file in `rootNames` (see [Production considerations](#production-considerations)).

```ts
// Validate handler return type is Effect (projection navigates to return type)
const handlerExport = snapshot.exports.find((e) => e.name === "handler");
if (handlerExport && !api.isAssignableTo(handlerExport.type, "Effect", [{ kind: "returnType" }])) {
  return { errors: [{ code: "CONTRACT-001", message: "handler must return Effect", pluginName: name }] };
}
```

### Watch descriptors and errors

**Watch**: `api.file(..., { watch: true })` or `api.directory(..., { watch: true })` records descriptors; the host calls `session.consumeDependencies()` → `WatchDependencyDescriptor[]` for invalidation.

**Build errors**: Return `{ errors: [{ code, message, pluginName }] }` for structured failures. Use `isVirtualModuleBuildError(result)` to detect.

### Reference implementations

- **Router plugin** ([`@typed/app` RouterVirtualModulePlugin](../../app/src/RouterVirtualModulePlugin.ts)) — `api.directory()`, type targets (Route, Fx, Effect), assignability for route/entrypoint validation.
- **HttpApi plugin** ([`@typed/app` HttpApiVirtualModulePlugin](../../app/src/HttpApiVirtualModulePlugin.ts)) — `api.directory()`, `api.isAssignableTo()` for handler/route/success/error contracts.
- **Tests**: [TypeInfoApi.test.ts](src/TypeInfoApi.test.ts), [vitePlugin.integration.test.ts](../virtual-modules-vite/src/vitePlugin.integration.test.ts) for minimal file/directory plugins.

## Production considerations

- **Path contract** – `baseDir` must be an absolute path; `relativePath` (and resolved paths) must not escape `baseDir`. Path containment is enforced: escaping returns an error (`path-escapes-base` or `invalid-input`).
- **Plugin contract** – `build()` must not trigger module resolution. Re-entrancy is detected and may surface as unresolved resolution or a diagnostic (`re-entrant-resolution`).
- **TypeScript** – Tested with TypeScript 5.x. The host supplies its own `typescript` instance. TypeInfoApi uses a small set of **internal** TypeScript APIs (see [Internal API usage](.docs/production-readiness.md#internal-api-usage) in production-readiness) for type-target resolution and assignability fallbacks; these are centralized in `internal/tsInternal.ts` and may require adjustment when upgrading TS.
- **Type targets and resolution** – Type targets (e.g. for `assignableTo`) are resolved from the **same TypeScript program** only: “remote” here means types from other packages already in the program (e.g. in `node_modules`), not from a registry. Resolution matches the **exact module specifier** used in imports; path/alias mapping is not applied. For targets not imported by app code, use `createTypeTargetBootstrapContent(specs)` and include the generated file in the program’s `rootNames`.
- **Watch debouncing** – Optional `debounceMs` on adapter options coalesces rapid file/glob watch events to avoid recomputation storms.

## Errors and gotchas

Full reference: [virtual-modules-errors-and-gotchas](.docs/virtual-modules-errors-and-gotchas.md). Summary:

- **`api.directory()`** may throw if TypeScript internal APIs throw during type serialization for a matched file. Not a typed error.
- **`api.file()`** returns a `FileSnapshotResult`: either `{ ok: true, snapshot }` or `{ ok: false, error, path? }`. Possible `error` values: `'file-not-in-program'` (path not in the program), `'path-escapes-base'` (path would escape baseDir), `'invalid-input'` (e.g. empty baseDir, null bytes, or invalid relativePath). Always check `result.ok` before using `result.snapshot`.
- **Adapter diagnostics** – The Language Service adapter may attach diagnostics for plugin failures (e.g. `plugin-build-threw`, `plugin-should-resolve-threw`), invalid build output (`invalid-build-output`), invalid options (`invalid-options`), re-entrant resolution (`re-entrant-resolution`), or virtual module rebuild failures. Plugin names and messages are included.
- **Loader errors** – `NodeModulePluginLoader.load()` returns structured errors with codes such as `module-not-found`, `module-load-failed`, `invalid-plugin-export`, `path-escapes-base`, and `invalid-request` (e.g. empty baseDir or specifier).

## Status

Early implementation. Covers plugin manager, TypeInfo API, Node loader, and LS/CompilerHost adapters. See package spec and tests for behavior and testing strategy.
