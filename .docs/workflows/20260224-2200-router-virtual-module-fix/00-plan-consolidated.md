# Fix router:* virtual module (TS plugin + VSCode) with consolidated behavior

## Objective

Fix `router:*` resolution in both the TS plugin and the VSCode extension by fixing root causes **and** consolidating shared behavior into `@typed/virtual-modules` so future fixes and features (e.g. other type-checked virtual modules, new consumers) reuse one implementation.

---

## Root causes (unchanged)

- **VSCode:** Resolver builds the program from tsconfig only; it never writes or includes the type-target bootstrap, so type targets are unresolved and the router plugin’s `isAssignableTo` checks always fail → resolution returns `undefined`.
- **TS plugin:** When the program is unavailable at first resolve (cold start), session creation throws and the user sees "Session creation failed". No shared “program with bootstrap” API is used by VSCode, so fixing VSCode without consolidation would duplicate logic.

---

## Consolidation strategy

Move all “type-target bootstrap path + ensure file + program that includes it” behavior into **one place** in `@typed/virtual-modules`, and have the TS plugin, VSCode resolver, and (optionally) the VMC use it. Also centralize the “program not available → treat as unresolved” contract in PluginManager.

### 1. Shared API in `@typed/virtual-modules`

**New file:** `packages/virtual-modules/src/typeTargetBootstrap.ts` (or equivalent; export from existing module if preferred).

- **Canonical bootstrap path**
  - Export a single path convention used everywhere: `projectRoot/.typed/type-target-bootstrap.ts`.
  - Function: `getTypeTargetBootstrapPath(projectRoot: string): string` (e.g. `join(projectRoot, ".typed", "type-target-bootstrap.ts")`).
  - All consumers (TS plugin, VSCode, VMC) use this path so there is no divergence (today TS plugin uses `.typed/type-target-bootstrap.ts`, VMC uses `node_modules/.typed/__typeTargetBootstrap.ts`).

- **Ensure bootstrap file on disk**
  - `ensureTypeTargetBootstrapFile(projectRoot, typeTargetSpecs, fs?)`: ensures `.typed` dir exists, writes `createTypeTargetBootstrapContent(typeTargetSpecs)` to the canonical path, returns that path.
  - Optional `fs` argument for dependency injection: `{ mkdirSync, writeFileSync }` (Node) by default; VMC can pass `{ mkdirSync: (d, opts) => ..., writeFile: (path, content) => ... }` so the same logic works with `ts.sys` and keeps the canonical path.

- **Program that includes the bootstrap**
  - `getProgramWithTypeTargetBootstrap(ts, program, projectRoot, typeTargetSpecs): ts.Program`:
    - If `!typeTargetSpecs?.length`, return `program` unchanged.
    - Otherwise call `ensureTypeTargetBootstrapFile(projectRoot, typeTargetSpecs)` (with default fs), get `bootstrapPath`, then:
      - If `program.getRootFileNames()` already includes the resolved bootstrap path, return `program`.
      - Else return `ts.createProgram([...program.getRootFileNames(), bootstrapPath], program.getCompilerOptions(), host)` with a host created from the same options (same as current TS plugin logic).
  - This way any consumer that has a `ts.Program` and `typeTargetSpecs` can get a “program with bootstrap” in one call. No duplicated path or write logic.

**Exports from `packages/virtual-modules/src/index.ts`:**  
`getTypeTargetBootstrapPath`, `ensureTypeTargetBootstrapFile`, `getProgramWithTypeTargetBootstrap`.

**VMC alignment (optional but recommended):**  
Update compile.ts, build.ts, watch.ts to use the same path (`getTypeTargetBootstrapPath`) and `ensureTypeTargetBootstrapFile(projectRoot, typeTargetSpecs, { mkdirSync, writeFile: sys.writeFile })` (or equivalent with their `sys`), and add that path to `effectiveRootNames` instead of `node_modules/.typed/__typeTargetBootstrap.ts`. That way a single path and one helper drive all three: TS plugin, VSCode, VMC.

---

### 2. TS plugin: use shared API

**File:** `packages/virtual-modules-ts-plugin/src/plugin.ts`

- Remove local `bootstrapPath`, `ensureBootstrapFile`, and `getProgramWithBootstrap`.
- Import `getProgramWithTypeTargetBootstrap` from `@typed/virtual-modules`.
- When building the session, call `getProgramWithTypeTargetBootstrap(ts, program, projectRoot, typeTargetSpecs ?? [])` (or pass `typeTargetSpecs` only when `hasTypeTargetSpecs`). Use the returned program for `createTypeInfoApiSession`.
- Behavior stays the same; implementation becomes a single call to the shared helper.

---

### 3. VSCode resolver: use shared API

**File:** `packages/virtual-modules-vscode/src/resolver.ts`

- When building the program for `createTypeInfoApiSession` and `typeTargetSpecs?.length > 0`, do **not** build from tsconfig fileNames only. Instead:
  - Build the base program as today: `ts.createProgram(parsed.fileNames, parsed.options, ts.createCompilerHost(parsed.options))`.
  - Call `getProgramWithTypeTargetBootstrap(ts, baseProgram, projectRoot, typeTargetSpecs)` and use the returned program for `createTypeInfoApiSession`.
- No local bootstrap path or write logic; one shared call. Cache the resulting program per project root and invalidate on `clearProgramCache()` as today.

---

### 4. PluginManager: “program not available” → unresolved

**File:** `packages/virtual-modules/src/PluginManager.ts`

- In the `resolveModule` try/catch around `createSession?.({ id, importer })`, when the caught error message indicates that the TypeInfo session could not be created because the program is not yet available (e.g. "Program not yet available" or "TypeInfo session creation failed"), **do not** return `status: "error"` with "session-creation-failed". Instead, **continue** to the next plugin; if no plugin resolves, return `status: "unresolved"`.
- Document this in code (and optionally in `types.ts` or a small “Resolver contract” note): session creation may throw with a “program not available” message; the resolver treats that as “unresolved” for that plugin so that retries (e.g. after project load) can succeed. This keeps the contract in one place for any future plugin that depends on a program.

---

## Summary of changes

| Area | Location | Change |
|------|----------|--------|
| **Shared bootstrap API** | New (or existing) module in `packages/virtual-modules/src` | Add `getTypeTargetBootstrapPath`, `ensureTypeTargetBootstrapFile`, `getProgramWithTypeTargetBootstrap`; export from index. Single path: `projectRoot/.typed/type-target-bootstrap.ts`. |
| **VMC** | compile.ts, build.ts, watch.ts | Optionally switch to shared path and `ensureTypeTargetBootstrapFile` so all consumers use the same path and helper. |
| **TS plugin** | plugin.ts | Replace local bootstrap/path and `getProgramWithBootstrap` with `getProgramWithTypeTargetBootstrap(ts, program, projectRoot, typeTargetSpecs)`. |
| **VSCode resolver** | resolver.ts | Build base program from tsconfig, then `getProgramWithTypeTargetBootstrap(ts, baseProgram, projectRoot, typeTargetSpecs)` and use result for TypeInfo session. |
| **PluginManager** | PluginManager.ts | On session creation throw with “program not available” message, treat as unresolved (continue to next plugin / return unresolved). Document contract. |

---

## Verification

- **VSCode:** Open sample project, Go to Definition on `router:./routes` → virtual content loads and route types resolve.
- **TS plugin:** `tsc --noEmit` in sample project; no “Session creation failed” for cold start; `router:*` resolves once project is loaded.
- **Reuse:** Any new consumer (e.g. another IDE or CLI) that needs a program with type targets imports `getProgramWithTypeTargetBootstrap` and uses the same path/behavior.

---

## Future reuse

- Adding a new type-checked virtual module or a new consumer (e.g. another editor) only requires using the shared `getProgramWithTypeTargetBootstrap` and the same bootstrap path.
- Fixes or changes to bootstrap content (e.g. new type targets, path convention) happen in one module; all consumers benefit.
- The “program not available” → unresolved contract is documented in PluginManager so plugin authors know how to rely on retry behavior.
