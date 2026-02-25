# Production-readiness assessment: `@typed/virtual-modules`

**Summary:** The implementation is **solid for a beta** and matches the spec’s design (first-match resolution, TypeInfo API, Node loader, LS/CompilerHost adapters, discriminated type AST). To treat it as **production-grade**, address the gaps below: path safety, error contracts, resource limits, and a few behavioral edge cases.

---

## What’s in good shape

- **Types:** Discriminated-union type AST (`TypeNode`), clear resolution/load result types, readonly where appropriate.
- **PluginManager:** First-match semantics, guarded `shouldResolve`/`build`, non-string build result → structured error, no silent swallows.
- **NodeModulePluginLoader:** Preloaded vs path-based, sync CJS via `createRequire`, normalized `default`/`plugin`, structured load errors (module-not-found, load-failed, invalid-plugin-export).
- **TypeInfoApi:** Cycle detection (visited set), maxDepth, `getDeclaredTypeOfSymbol` for type alias/interface, directory recursive via `**/` glob, watch descriptors, deterministic ordering.
- **Adapters:** Correct host/LS overrides (resolution, snapshot/sourceFile, fileExists, readFile, diagnostics), watch registration, dispose restores originals.
- **Path identity:** Stable virtual key and file name, sanitized plugin name segment, SHA-1 hash for virtual file names.
- **Tests:** Core flows covered (first-match, unresolved, plugin throw, loader paths, type kinds, directory recursive + watch, LS/Compiler virtual module in program, LS tester harness).

---

## Gaps to address for production

### 1. Path containment (security / correctness)

- `resolveRelativePath(baseDir, relativePath)` uses `resolve(baseDir, relativePath)` with no check that the result stays under `baseDir` (or a configured root). A relative path like `../../../etc/passwd` can escape.
- **Recommendation:** Add a path containment check (e.g. ensure resolved path is under `baseDir` after normalization) and either reject (throw or return a result type) or normalize to a safe path. Apply the same idea wherever plugin- or caller-controlled paths are resolved (e.g. `file(relativePath, { baseDir })`, directory glob base).

### 2. TypeInfoApi error contracts

- **Public `api.file()`** returns a `FileSnapshotResult` and does **not** throw for "file not in program". Always check `result.ok` before using `result.snapshot`.
- **Internal `createFileSnapshot`** still throws if given a path not in the program; callers guard before calling. A planned refactor passes `ts.SourceFile` instead of `filePath` to eliminate this throw.
- **`api.directory()`** may throw if TypeScript internal APIs throw during type serialization. Consider wrapping in try/catch.
- **Legacy:** `createFileSnapshot` previously threw; the public API now uses a result type.

### 3. Stale record after failed rebuild

- **LanguageServiceAdapter:** When rebuild fails, it adds a diagnostic and returns the old record.
- **CompilerHostAdapter:** When rebuild fails, it returns the old record. If `reportDiagnostic` is passed to `attachCompilerHostAdapter`, a diagnostic is reported (vmc compile/build/watch pass it by default).
### 4. Unbounded adapter state

- `recordsByKey` / `recordsByVirtualFile` (and related maps) grow with every distinct virtual module and are never evicted. Long-lived processes (e.g. editor LS) could accumulate many entries.
- **Recommendation:** Consider a cap or TTL (e.g. LRU), or document that long-lived use may require periodic dispose/reattach or project restart.

### 5. Watch callbacks not debounced

- File/glob watchers call `markStale` (and in LS bump `epoch`) on every event. Rapid churn can cause many recomputations.
- **Recommendation:** Consider debouncing or batching invalidation (as in the spec’s replanning triggers), especially for directory/glob watches.

### 6. Input validation

- Plugin `name`, `id`, `importer`, and options like `baseDir` / `relativePath` are not validated (empty, very long, or malicious-looking values). This can make diagnostics and security reasoning harder.
- **Recommendation:** Add minimal validation at boundaries (e.g. non-empty plugin name, reasonable path length) and return structured errors instead of failing later in obscure ways.

### 7. Re-entrancy

- Resolution and build are synchronous; adapter state is mutated during resolution. If a plugin’s `build()` triggers another resolution (e.g. via host or program access), re-entrancy could corrupt state or cause infinite loops.
- **Recommendation:** Document that plugins must not trigger resolution during `build`, or add a simple re-entrancy guard (e.g. a flag or “resolution in progress” set) and fail fast if violated.

### 8. Documentation and contracts

- README has an API overview but no “Production considerations”, path contract (e.g. “baseDir must be absolute”, “relativePath must not escape baseDir”), or TypeScript version compatibility.
- **Recommendation:** Add a short “Production / security” section, path and plugin contracts, and a note on supported TS versions.

#### Internal API usage (TypeInfoApi)

- TypeInfoApi centralizes use of non-public TypeScript APIs in `src/internal/tsInternal.ts`: `getIndexInfosOfType`, `getAliasedSymbol`, `getBaseTypes`, and TypeReference/symbol shape access for assignability fallbacks. These are not part of the public TS contract and may change across versions.
- **Supported:** Tested with TypeScript 5.x. When upgrading TS, run the test suite and consider updating or guarding the helpers in `tsInternal.ts`.

### 9. Test coverage gaps

- No tests for: path traversal attempt, `file()` when file is not in program, empty plugin list, duplicate plugin names, maxDepth behavior, watch-driven invalidation (deterministic), dispose-then-use, or double attach/detach.
- **Recommendation:** Add tests for path containment, missing file, and dispose/attach behavior; add or document watch/invalidation tests if feasible.

---

## Verdict

- **Current state:** Suitable for **beta / early adoption** with the above limitations understood.
- **Production use:** After implementing path containment, clarifying error contracts (and/or fixing stale-after-failed-rebuild), and optionally adding validation, eviction/debounce, and the suggested docs and tests, the package can be treated as **production-grade** for the current scope (sync-only, TS LS + CompilerHost, Node loader).
