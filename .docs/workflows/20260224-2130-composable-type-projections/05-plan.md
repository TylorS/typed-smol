# Execution Plan: Composable Type Projections

## Subgoal DAG

```
SG-1: types.ts changes (TypeProjectionStep, TypeInfoApi, ExportedTypeInfo)
  ↓
SG-2: TypeInfoApi.ts implementation (WeakMap, applyProjection, isAssignableTo, remove hardcoded fields)
  ↓
SG-3: Export updates (index.ts, collectTypeTargetSpecs.ts if needed)
  ↓
SG-4: Consumer migration — routeTypeNode.ts + buildRouteDescriptors.ts
  ↓  (parallel with)
SG-5: Consumer migration — HttpApiVirtualModulePlugin.ts
  ↓
SG-6: Test migration — TypeInfoApi.test.ts (new isAssignableTo tests)
  ↓  (parallel with)
SG-7: Test migration — RouterVirtualModulePlugin.test.ts
  ↓  (parallel with)
SG-8: Test migration — HttpApiVirtualModulePlugin.test.ts
  ↓
SG-9: Build + lint + type-check validation
```

## Task Details

### SG-1: Type definitions (types.ts)

- **Maps to**: FR-3, FR-6, FR-7, FR-8
- **Actions**:
  1. Add `TypeProjectionStep` discriminated union
  2. Add `isAssignableTo(node: TypeNode, targetId: string, projection?: readonly TypeProjectionStep[]): boolean` to `TypeInfoApi` interface
  3. Remove `assignableTo`, `returnTypeAssignableTo`, `firstParamAssignableTo`, `returnTypeEffectSuccessAssignableTo` from `ExportedTypeInfo`
  4. Remove the JSDoc comment block describing pre-computed assignability
- **Risk**: Low — pure interface changes
- **Validation**: `tsc -b` passes after SG-2

### SG-2: TypeInfoApi.ts implementation

- **Maps to**: FR-1, FR-2, FR-4, FR-5, NFR-1
- **Prerequisites**: SG-1
- **Actions**:
  1. Create per-session `WeakMap<TypeNode, ts.Type>` in `createTypeInfoApiSession`
  2. Thread the WeakMap into `serializeTypeNode` (and `serializeFunctionSignature`, `serializeObjectProperties`, etc.) so every created TypeNode is registered
  3. Implement `applyProjection(type: ts.Type, steps: readonly TypeProjectionStep[], checker, tsMod, onInternalError?): ts.Type | undefined` — chains steps, returns undefined on failure
  4. Implement `isAssignableTo` on the API object: WeakMap lookup → apply projection → target lookup → checker assignability
  5. Remove the 4 hardcoded field computation blocks from `serializeExport()` (lines ~831-878)
  6. Remove `getFirstTypeArgument` helper (subsumed by `applyProjection` with `typeArg` step)
- **Risk**: Medium — core logic change. Mitigated by keeping `isAssignableTo` (the checker function) and `serializeTypeNode` unchanged.
- **Validation**: Unit tests in SG-6

### SG-3: Export updates

- **Maps to**: FR-8
- **Prerequisites**: SG-1
- **Actions**:
  1. Export `TypeProjectionStep` from `packages/virtual-modules/src/index.ts`
  2. Verify `TypeInfoApi` is already re-exported (it is)
- **Risk**: Low
- **Validation**: `tsc -b`

### SG-4: Router consumer migration

- **Maps to**: FR-9
- **Prerequisites**: SG-2
- **Actions**:
  1. Update `routeTypeNode.ts`: all helper functions now receive `api: TypeInfoApi` and the `TypeNode` and call `api.isAssignableTo(...)` instead of reading pre-computed maps
  2. Update `buildRouteDescriptors.ts`: pass `api` to helper functions, update call sites
  3. Update `RouterVirtualModulePlugin.ts`: pass `api` through to build helpers
- **Risk**: Medium — many call sites but all mechanical
- **Validation**: Tests in SG-7

### SG-5: HttpApi consumer migration

- **Maps to**: FR-9
- **Prerequisites**: SG-2
- **Actions**:
  1. Update `HttpApiVirtualModulePlugin.ts`: replace `exp.returnTypeAssignableTo?.Effect` with `api.isAssignableTo(...)` calls, replace `exp.returnTypeEffectSuccessAssignableTo?.HttpServerResponse` with projected call
- **Risk**: Low — 2 call sites
- **Validation**: Tests in SG-8

### SG-6: TypeInfoApi.test.ts

- **Maps to**: AC-1, AC-2, AC-3, AC-4 (TS-1 through TS-5)
- **Prerequisites**: SG-2
- **Actions**:
  1. Add tests for `isAssignableTo` with no projection (direct check)
  2. Add tests for `isAssignableTo` with `returnType` projection
  3. Add tests for `isAssignableTo` with `typeArg` projection
  4. Add tests for `isAssignableTo` with chained projection (`returnType` → `typeArg[0]`)
  5. Add test for sub-node passed directly (FR-2, AC-2)
  6. Add test for projection on wrong shape (AC-3)
  7. Remove/update tests that assert pre-computed assignability fields

### SG-7: RouterVirtualModulePlugin.test.ts

- **Maps to**: AC-6 (TS-6)
- **Prerequisites**: SG-4
- **Actions**: Update inline snapshots and test assertions for migrated API

### SG-8: HttpApiVirtualModulePlugin.test.ts

- **Maps to**: AC-6 (TS-7)
- **Prerequisites**: SG-5
- **Actions**: Update inline snapshots and test assertions for migrated API

### SG-9: Final validation

- **Maps to**: all NFRs
- **Prerequisites**: SG-6, SG-7, SG-8
- **Actions**: `pnpm build`, `pnpm test`, `ReadLints` on all modified files
- **Validation**: Zero errors

## Replanning Triggers

- If `serializeTypeNode` signature change causes cascading issues → localize WeakMap registration to a wrapper function instead of threading through all args
- If consumer migration reveals patterns not covered by the 4 step kinds → add a new step kind (NFR-4 extensibility)
- If test failures reveal edge cases in projection → add targeted test and fix before proceeding

## Rollback

- Git: all changes are uncommitted until finalization; `git checkout` reverts everything
- No external state mutations (no DB, no npm publish)

## Memory Plan

- **Short-term**: capture projection vocabulary and API pattern in `workflows/<slug>/memory/`
- **Promotion criteria**: if pattern proves stable after execution and tests pass, promote to `.docs/_meta/memory/`
- **Recall**: `.docs/_meta/memory/typeinfoapi-structural-type-targets.md` will need updating to reference new API
