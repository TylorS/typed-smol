# TypeInfoApi production improvements (avoid internal APIs where possible)

**Objective:** Improve all production-readiness gaps from the three agent assessments and **reduce or eliminate use of internal TypeScript APIs** where feasible; centralize and guard any that remain.

---

## 1. Internal TypeScript API strategy: avoid or centralize

### 1.1 getBaseTypes (assignability fallback)

- **Current use:** [TypeInfoApi.ts L786–797](packages/virtual-modules/src/TypeInfoApi.ts): compatibility-mode fallback when checker says “not assignable”; checks inheritance via internal `getBaseTypes`.
- **Action: Remove.** Rely on `checker.isTypeAssignableTo` for inheritance. When the checker says no (e.g. cross-file), we do not add an inheritance fallback. Compatibility mode still keeps: generic base match, TypeReference target match, symbol/name match.
- **Outcome:** One less internal API; slightly weaker compatibility for cross-file interface extends only when checker refuses.

### 1.2 ObjectFlags.Mapped (mapped type serialization)

- **Current use:** [TypeInfoApi.ts L375–379](packages/virtual-modules/src/TypeInfoApi.ts): `(objType.objectFlags & (tsMod.ObjectFlags?.Mapped ?? 32)) !== 0` to detect mapped types.
- **Action: Avoid numeric fallback.** Use only `tsMod.ObjectFlags?.Mapped` when it exists. When `ObjectFlags` or `Mapped` is missing, **do not** use `?? 32`; treat as non-mapped and serialize as object/reference from existing branches (e.g. by `typeToString` or existing object path). Add a short comment: “Mapped type detection only when ObjectFlags is available.”
- **Outcome:** No brittle hardcoded flag; graceful degradation when TS changes.

### 1.3 getIndexInfosOfType (index signature serialization)

- **Current use:** [TypeInfoApi.ts L194](packages/virtual-modules/src/TypeInfoApi.ts): `serializeIndexSignature` uses it to get key/value types for index signatures.
- **Options:**
  - **A (preferred):** Keep a **single guarded use** in one helper. Wrap in try/catch; if missing or throws, return `undefined` and let callers treat the type as object/reference (existing behavior when no index info). Document: “Uses internal getIndexInfosOfType when available; no public API for index signature structure.”
  - **B:** Degrade: when internal API is unavailable, serialize index-signature types as a generic “object” or “reference” with `checker.typeToString(type)` only (no keyType/valueType in output).
- **Recommendation:** A — minimal behavior change, one clearly documented internal use.

### 1.4 getAliasedSymbol and Symbol.exports (type target resolution + assignability)

- **Current use:** [TypeInfoApi.ts L567–576, 609–612, 707–709](packages/virtual-modules/src/TypeInfoApi.ts): Resolve re-exports/aliases for type targets; resolve `typeMember` (e.g. `Route.Any`) via namespace/merged symbol exports.
- **Public alternative for .exports:** For **module** symbols, use `checker.getExportsOfModule(symbol)` instead of `(aliased as any).exports`. Use this when the aliased symbol is the module (e.g. namespace import). For merged interface+namespace, `getExportsOfModule` may not apply (it’s for file modules). So:
  - **Replace** `(aliased as ts.Symbol & { exports?: Map<...> }).exports` with `checker.getExportsOfModule(aliased)` when we need “exports” of the resolved symbol, and only when that symbol is a module (e.g. `symbol.flags & SymbolFlags.Module` or similar). If not a module, keep a single fallback path that uses internal `.exports` only when present, with try/catch.
- **getAliasedSymbol:** No public API to “resolve alias to target symbol.” **Centralize** in one helper (e.g. `resolveAliasedSymbol(symbol, checker)`), guard with `SymbolFlags.Alias` and try/catch; document supported TS versions. Call this from both `resolveTypeTargetsFromSpecs` and `resolveExportSymbol`.
- **Outcome:** Fewer internal surface (getExportsOfModule where applicable); one documented, guarded alias resolution.

### 1.5 TypeReference.target and type.symbol (assignability compatibility fallback)

- **Current use:** [TypeInfoApi.ts L720, 779, 735, etc.](packages/virtual-modules/src/TypeInfoApi.ts): Get generic “base” type and symbol for comparison when checker says not assignable.
- **Reality:** No public API exposes “target type” of a TypeReference or “symbol” on every Type. **Centralize** in one small module or section: e.g. `getGenericBase(type, checker)` and `getComparisonSymbol(type, checker)` that use `(type as any).target` and `(type as any).symbol` with try/catch and optional chaining. Document: “Uses internal TypeReference/symbol shape for compatibility fallbacks when checker.isTypeAssignableTo returns false.”
- **Outcome:** Single, documented internal surface; no behavioral change.

### 1.6 Centralization and docs

- **Add** a single module or top-of-file section “Internal TS API usage” that:
  - Lists each remaining internal use (getIndexInfosOfType, getAliasedSymbol, TypeReference.target / type.symbol, and if kept Symbol.exports fallback).
  - States that these are not part of the public TS API and may change across versions.
  - References supported TypeScript version (e.g. “Tested with TypeScript 5.x”) in [README](packages/virtual-modules/README.md) and, if present, [production-readiness](packages/virtual-modules/.docs/production-readiness.md).

---

## 2. ImportInfo.resolvedFilePath

- **Problem:** [types.ts](packages/virtual-modules/src/types.ts) declares `resolvedFilePath`; [collectImports](packages/virtual-modules/src/TypeInfoApi.ts) never sets it.
- **Options:** (A) Implement via `program.getResolvedModuleWithFailedLookupLocations` (or equivalent) and set when resolved module is a project file; add test. (B) Document as optional/not currently set.
- **Recommendation:** Implement (A) if plugins need resolved paths; otherwise (B). Plan assumes (A) with a test.

---

## 3. directory() caching

- **Problem:** [directory()](packages/virtual-modules/src/TypeInfoApi.ts) (L1080–1138) recomputes snapshots every time; [file()](packages/virtual-modules/src/TypeInfoApi.ts) uses a per-session cache.
- **Action:** Add per-session cache keyed by `baseDir + '\0' + sorted(relativeGlobs).join('\0') + (recursive ? 'r' : '')`. Return cached result when same query is repeated. Cache lives next to existing `snapshotCache` and is cleared when session is created.
- **Test:** Two identical `directory(...)` calls return same snapshots; different query does not hit cache.

---

## 4. Documentation

- **“Remote” resolution and bootstrap:** Add a short section (README or `.docs` spec):
  - “Remote” = types from packages **already in the same program** (e.g. node_modules). No registry fetch.
  - Type targets resolved by **exact module specifier**; no path/alias mapping in this API.
  - Bootstrap (e.g. `createTypeTargetBootstrapContent`) required for targets not imported by app code.
- **Internal API usage:** As in §1.6, document remaining internal uses and supported TS version.

---

## 5. Error handling

- **Action:** Document in code/comments: assignability and serialization fallbacks may catch internal API errors and degrade (e.g. “not assignable” or safe serialization); no errors thrown to caller. Optionally add `onInternalError?: (err: unknown, context: string) => void` to session options and call from catch blocks when provided.

---

## 6. Optional follow-on: high compatibility

- Extended TypeNode/serializer coverage (TypeOperator, Enum, Infer, etc.) remains a separate phase after this production-hardening and API-reduction work.

---

## Implementation order

| Phase | Work                                                                                                                                                | Deliverable                                    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **1** | §1.1 Remove getBaseTypes fallback; §1.2 ObjectFlags no numeric fallback; §1.6 Centralize + document remaining internal APIs                         | Fewer internal APIs; single documented surface |
| **2** | §1.3 Guard getIndexInfosOfType; §1.4 getExportsOfModule where applicable + centralize getAliasedSymbol; §1.5 Centralize TypeReference.target/symbol | All internal use centralized and guarded       |
| **3** | §2 resolvedFilePath (implement + test or document); §4 docs                                                                                         | Clear contract; optional resolution fidelity   |
| **4** | §3 directory() cache + test; §5 error-handling docs (and optional callback)                                                                         | Performance and observability                  |

---

## Summary

- **Avoid where possible:** Remove getBaseTypes fallback; remove ObjectFlags numeric fallback; use getExportsOfModule instead of Symbol.exports when symbol is a module.
- **Centralize and guard:** getIndexInfosOfType, getAliasedSymbol, TypeReference.target / type.symbol, and any remaining Symbol.exports fallback; try/catch and “when available” checks; document supported TS version.
- **Other improvements:** resolvedFilePath, directory() cache, “remote”/bootstrap docs, error-handling documentation (and optional callback).
