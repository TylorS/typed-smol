# Router Plugin Fixes Plan

## 0. TypeInfoApi: Resolve references to literal type for full structural checks (prerequisite)

**Problem:** Checks against type references (e.g. `getReferenceTypeName` for "Layer", "Effect", "Fx") are insufficient. We need fully structural type checks.

**Files:** [packages/virtual-modules/src/TypeInfoApi.ts](packages/virtual-modules/src/TypeInfoApi.ts), [packages/app/src/internal/resolveTypeTargets.ts](packages/app/src/internal/resolveTypeTargets.ts)

- **TypeInfoApi** (`serializeExport`): Ensure `exportedType` used for `checker.isTypeAssignableTo` is resolved to its literal/structural type—follow type aliases, resolve through references, avoid comparing against unresolved reference nodes. Use `checker.getApparentType`, follow `type.aliasSymbol`/`type.aliasTypeArguments` if present, or equivalent resolution so we compare structural types, not reference names.
- **resolveTypeTargets** (or TypeInfoApi): Ensure typeTargets are always available for router plugin use. If the program does not import Layer/Effect/Fx/etc., consider resolving them via `program.getTypeRoots` + module resolution, or require the host to pass a minimal bootstrap file that imports these types. Goal: `assignableTo` is always populated when the plugin needs it.
- **routeTypeNode.ts** (after above): Remove all `getReferenceTypeName` string-based fallbacks. Rely exclusively on `assignableTo`; when absent, treat as "unknown" and fail validation (RVM-DEPS-001, etc.) instead of guessing from reference names.

## 1. Fix Fx import style

**File:** [packages/app/src/internal/emitRouterSource.ts](packages/app/src/internal/emitRouterSource.ts)

- Change line 118 from `import { Fx } from "@typed/fx"` to `import * as Fx from "@typed/fx"` for consistency with Router and the existing test snapshots.

## 2. Replace type casts with type guards

**File:** [packages/app/src/internal/buildRouteDescriptors.ts](packages/app/src/internal/buildRouteDescriptors.ts)

- Add type guard functions:
  - `function isEntryPointExport(name: string): name is EntryPointExport` — checks `ENTRYPOINT_EXPORTS.includes(name)`
  - `function isGuardExportName(name: string): name is "default" | "guard"` — checks `GUARD_EXPORT_NAMES.includes(name)`
  - `function isCatchExportName(name: string): name is "catch" | "catchFn"` — checks `CATCH_EXPORT_NAMES.includes(name)`
- Replace `entrypoint.name as EntryPointExport` (line 103) with guarded access.
- Replace `guardExport.name as "default" | "guard"` (lines 293, etc.) with guarded access.
- Replace `catchExport.name as "catch" | "catchFn"` (lines 317, 329) with guarded access.

## 3. Remove ?? fallbacks; fail when required data is missing

**File:** [packages/app/src/internal/routerDescriptorTree.ts](packages/app/src/internal/routerDescriptorTree.ts)

- **Line 139:** `catchExportByPath[catchPath] ?? "catch"` — Replace with explicit lookup and throw if missing.
- **Lines 281, 335:** `ctx.catchFormByPath[companions.catch] ?? { form: "native", returnKind: "fx" }` — Replace with explicit lookup and throw when missing.
- **Line 335 (emitRoute):** Same treatment for `match.catchForm`.

## 4. Avoid Router.merge when not necessary

**File:** [packages/app/src/internal/routerDescriptorTree.ts](packages/app/src/internal/routerDescriptorTree.ts)

- **children.length === 0:** Currently emits `Router.merge()`. Treat as invalid — throw.
- **children.length === 1:** Already correct — no merge.
- **children.length >= 2:** Keep `Router.merge(...)`.
- Fix any golden snapshots that incorrectly show single-arg merge.

## 5. Remove parentheses around Router.merge / Router.match when chaining

**File:** [packages/app/src/internal/routerDescriptorTree.ts](packages/app/src/internal/routerDescriptorTree.ts)

- `Router.merge(...)` and `Router.match(...)` both return chainable values; `.layout()`, `.provide()`, `.catchCause()` can be chained directly without wrapping in parens.
- Remove `needsParensForChain` and all conditional `(${inner}).layout(...)` wrapping.
- Always use `${inner}.layout(...)` (and similarly for `.provide`, `.catchCause`).
- Update golden snapshots that currently expect `(Router.merge(...)).provide(...)` to expect `Router.merge(...).provide(...)`.

## 6. Add nested Router.merge test

**File:** [packages/app/src/RouterVirtualModulePlugin.test.ts](packages/app/src/RouterVirtualModulePlugin.test.ts)

Create test `it("golden: nested Router.merge when multiple dir levels have multiple siblings")` with fixture:

```
routes/
  page.ts          -> /
  about.ts         -> /about
  docs/
    index.ts       -> /docs
    guide.ts       -> /docs/guide
  api/
    status.ts      -> /api/status
    users/
      index.ts     -> /api/users
      [id].ts      -> /api/users/:id
```

Expect emitted source to contain nested `Router.merge(` calls matching the directory structure. Assert multiple `Router.merge` occurrences and correct nesting.

## Summary of file changes

| File                              | Changes                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| TypeInfoApi.ts                    | Resolve exportedType to literal/structural type before assignableTo checks                                       |
| resolveTypeTargets.ts             | Ensure typeTargets available when program lacks target imports (or document requirement)                         |
| routeTypeNode.ts                  | Remove getReferenceTypeName fallbacks; use assignableTo only; unknown → fail                                     |
| emitRouterSource.ts               | Fx import: `import * as Fx`                                                                                      |
| buildRouteDescriptors.ts          | Type guards; remove `as` casts                                                                                   |
| routerDescriptorTree.ts           | Remove ?? fallbacks; throw for 0 children; remove needsParensForChain                                            |
| RouterVirtualModulePlugin.test.ts | Update snapshots (Fx import, no parens); add nested merge golden; ensure buildRouterFromFixture uses typeTargets |
