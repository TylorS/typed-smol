# Virtual modules: errors and gotchas

Single reference for all throws and surprising behavior across the virtual-modules packages. See [Production considerations](../../README.md#production-considerations) and [production-readiness](production-readiness.md) for more context.

## Summary: where errors come from

| Source       | Packages                                                           | How errors surface                                                                   |
| ------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- | ------------ | ---------- |
| Throws       | virtual-modules, virtual-modules-ts-plugin, virtual-modules-vscode | `throw new Error(...)` or `vscode.FileSystemError.*`                                 |
| Result types | virtual-modules                                                    | `api.file()` returns `{ ok: true, snapshot }                                         | { ok: false, error }`; resolver returns `{ status: "resolved" | "unresolved" | "error" }` |
| Diagnostics  | virtual-modules (LS adapter)                                       | TS diagnostics on importer file (e.g. `plugin-build-threw`, `re-entrant-resolution`) |
| Console      | virtual-modules-vite                                               | `console.warn` when `warnOnError` is true                                            |
| Exit code    | virtual-modules-compiler                                           | Exit code 1 when TS diagnostics include errors                                       |

---

## By package

### @typed/virtual-modules

**Throws**

| Location                      | Condition                                                           | Message / behavior                                                                                                                                  | How to avoid or handle                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CompilerHostAdapter.ts:15     | `projectRoot` empty or not a string                                 | `"projectRoot must be a non-empty string"`                                                                                                          | Pass a non-empty string.                                                                                                                                                                     |
| LanguageServiceAdapter.ts:109 | Same                                                                | Same                                                                                                                                                | Same.                                                                                                                                                                                        |
| PluginManager                 | TypeInfoApi not configured (createTypeInfoApiSession not provided)  | No longer throws. Returns safe defaults: `file()` → `{ ok: false, error: 'invalid-input' }`, `directory()` → `[]`, `resolveExport()` → `undefined`. | **Contract:** Hosts should always supply `createTypeInfoApiSession` when plugins use the API for correct behavior. Without it, plugins get empty results.                                    |
| TypeInfoApi                   | (was: `createFileSnapshot` file not in program)                     | **Removed.** `createFileSnapshot` now takes `ts.SourceFile`; the throw was eliminated.                                                              | N/A                                                                                                                                                                                          |
| TypeInfoApi.ts:1016–1018      | `createTypeInfoApiSession`: type targets from specs resolve to zero | Use `createTypeTargetBootstrapContent` and add to `rootNames`                                                                                       | Set `failWhenNoTargetsResolved: false` or ensure program imports target modules. Use `createTypeTargetBootstrapContent(typeTargetSpecs)` and include in `rootNames` if targets not imported. |

**Gotchas**

- **Stale record after failed rebuild (CompilerHost):** When a virtual record is stale and rebuild fails, CompilerHostAdapter returns the old (stale) content. If `reportDiagnostic` is passed to `attachCompilerHostAdapter`, a diagnostic is reported (matches LanguageServiceAdapter behavior). vmc compile/build/watch pass `reportDiagnostic` by default.
- **`api.directory()` serialization:** Serialization failures for individual files are caught; the failing file is skipped and `onInternalError` is called if provided. The rest of the directory result is returned. No throw.
- **Internal TS APIs (tsInternal.ts):** Non-public TS APIs are used; they catch and return fallbacks. Callers should be aware of TS version sensitivity.
- **Re-entrancy:** If a plugin's `build()` triggers module resolution, re-entrancy is detected and surfaces as unresolved resolution or diagnostic.

---

### @typed/virtual-modules-compiler

**Throws:** None in the compiler package itself.

**Gotchas**

- Errors are surfaced via exit code (1) and TS diagnostics. If the host or adapter throws (e.g. invalid `projectRoot`), that propagates uncaught. No explicit documentation of adapter/resolver throws (e.g. projectRoot not validated by vmc before calling the adapter).

---

### @typed/virtual-modules-ts-plugin

**Throws**

| Location                                                               | Condition                                                                  | Message / behavior                                                                             | How to avoid or handle                                                       |
| ---------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| plugin.ts:266–268                                                      | TypeInfo session requested but program not yet available, no fallback      | `"TypeInfo session creation failed: Program not yet available. Retry when project is loaded."` | Happens on first open or before first compile. Retry when project is loaded. |
| plugin.ts:284–293                                                      | `createTypeInfoApiSession` throws (e.g. type targets fail), no fallback    | Re-throws the same error                                                                       | Ensure type targets resolve or use fallback program.                         |
| Sample scripts (typecheck-with-plugin.mjs, verify-virtual-modules.mjs) | tsconfig read failure, missing vmc config, plugin load failure, no plugins | Scripts throw on config/load failure                                                           | Document as expected; use valid config and plugins.                          |

**Gotchas**

- Editor may request virtual module resolution before project is fully loaded; plugin code using `api` may see "Program not yet available".
- Plugin load failure in tsserver surfaces as a thrown error from the plugin `create` function; message includes "Plugin load failed" and code.

---

### @typed/virtual-modules-vscode

**Throws**

| Location                                | Condition                                                                        | Message / behavior                         | How to avoid or handle                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| TypedVirtualFileSystemProvider.ts:43–65 | Invalid or unresolvable `typed-virtual://` URI                                   | `vscode.FileSystemError.FileNotFound(uri)` | Used for parse fail, no project root, resolver returns nothing. Callers cannot distinguish without parsing the URI. |
| TypedVirtualFileSystemProvider.ts:75–87 | `createDirectory`, `writeFile`, `delete`, `rename`                               | `vscode.FileSystemError.NoPermissions()`   | Provider is read-only.                                                                                              |
| extension.ts:466                        | `writeVirtualPreviewAndGetPath` throws (e.g. disk error) during Go to Definition | Re-throws to VS Code                       | Write failures (permission, disk full) surface as definition failures.                                              |

**Gotchas**

- FileNotFound is used for "URI invalid", "project root not found", and "resolver returned no content".
- Re-throwing from the definition provider shows a generic error in the editor.

---

### @typed/virtual-modules-vite

**Throws:** None. Resolution/load failures result in `resolveId` / `load` returning `null` and optional `console.warn` when `warnOnError` is true.

**Gotchas**

- When resolution or load fails, the import fails at build/dev (module not found) with no structured error type; only the warning message is visible. Resolution errors are reported via console and null return, not thrown.

---

## Cross-cutting

- **TypeInfoApi must always be configured:** Hosts that use plugins needing type info must supply `createTypeInfoApiSession`. There is no supported "not configured" path.
- **Type targets and resolution:** Resolved from the same TS program; module specifier must match imports exactly. Use `createTypeTargetBootstrapContent` for targets not imported by app code.
- **Re-entrancy:** Plugins must not trigger module resolution during `build()`.
- **Path contract:** `baseDir` must be absolute; `relativePath` must not escape it. Path containment is enforced.
- **Internal TS APIs:** TypeInfoApi uses non-public TS APIs in `internal/tsInternal.ts`; may require adjustment when upgrading TS.

---

## References

- [virtual-modules README — Errors](../README.md#errors)
- [virtual-modules README — Production considerations](../README.md#production-considerations)
- [production-readiness](production-readiness.md)
- Package READMEs: ts-plugin, vscode, vite, compiler (Errors subsections)
