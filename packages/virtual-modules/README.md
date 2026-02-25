# @typed/virtual-modules

Synchronous, type-safe virtual module primitives for TypeScript Language Service and compiler-host integrations.

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

## Production considerations

- **Path contract** – `baseDir` must be an absolute path; `relativePath` (and resolved paths) must not escape `baseDir`. Path containment is enforced: escaping returns an error (`path-escapes-base` or `invalid-input`).
- **Plugin contract** – `build()` must not trigger module resolution. Re-entrancy is detected and may surface as unresolved resolution or a diagnostic (`re-entrant-resolution`).
- **TypeScript** – Tested with TypeScript 5.x. The host supplies its own `typescript` instance. TypeInfoApi uses a small set of **internal** TypeScript APIs (see [Internal API usage](.docs/production-readiness.md#internal-api-usage) in production-readiness) for type-target resolution and assignability fallbacks; these are centralized in `internal/tsInternal.ts` and may require adjustment when upgrading TS.
- **Type targets and resolution** – Type targets (e.g. for `assignableTo`) are resolved from the **same TypeScript program** only: “remote” here means types from other packages already in the program (e.g. in `node_modules`), not from a registry. Resolution matches the **exact module specifier** used in imports; path/alias mapping is not applied. For targets not imported by app code, use `createTypeTargetBootstrapContent(specs)` and include the generated file in the program’s `rootNames`.
- **Watch debouncing** – Optional `debounceMs` on adapter options coalesces rapid file/glob watch events to avoid recomputation storms.

## Errors

- **`api.file()`** returns a `FileSnapshotResult`: either `{ ok: true, snapshot }` or `{ ok: false, error, path? }`. Possible `error` values: `'file-not-in-program'` (path not in the program), `'path-escapes-base'` (path would escape baseDir), `'invalid-input'` (e.g. empty baseDir, null bytes, or invalid relativePath). Always check `result.ok` before using `result.snapshot`.
- **Adapter diagnostics** – The Language Service adapter may attach diagnostics for plugin failures (e.g. `plugin-build-threw`, `plugin-should-resolve-threw`), invalid build output (`invalid-build-output`), invalid options (`invalid-options`), re-entrant resolution (`re-entrant-resolution`), or virtual module rebuild failures. Plugin names and messages are included.
- **Loader errors** – `NodeModulePluginLoader.load()` returns structured errors with codes such as `module-not-found`, `module-load-failed`, `invalid-plugin-export`, `path-escapes-base`, and `invalid-request` (e.g. empty baseDir or specifier).

## Status

Early implementation. Covers plugin manager, TypeInfo API, Node loader, and LS/CompilerHost adapters. See package spec and tests for behavior and testing strategy.
