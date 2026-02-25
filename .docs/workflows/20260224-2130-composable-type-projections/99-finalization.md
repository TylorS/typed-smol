# Finalization: Composable Type Projections

## What Changed

Replaced pre-computed assignability fields on `ExportedTypeInfo` with a dynamic `TypeInfoApi.isAssignableTo(node, targetId, projection?)` method. Key changes:

1. **types.ts**: Added `TypeProjectionStep` union, added `isAssignableTo` to `TypeInfoApi`, removed 4 fields from `ExportedTypeInfo`
2. **TypeInfoApi.ts**: Per-session `WeakMap<TypeNode, ts.Type>` threaded through serialization, `applyProjection` implementation, `isAssignableTo` wired into the API, removed `getFirstTypeArgument` and hardcoded assignability blocks from `serializeExport`
3. **Consumer migration**: `routeTypeNode.ts`, `buildRouteDescriptors.ts`, `HttpApiVirtualModulePlugin.ts`, `RouterVirtualModulePlugin.ts` — all switched from `.assignableTo` maps to `api.isAssignableTo(...)` calls
4. **Test migration**: Updated assertions in 3 test files, added 6 new tests for the dynamic API

## Validation Performed

- `tsc -b --noEmit`: zero errors
- `pnpm test`: 489/489 tests pass
- `ReadLints`: clean on all modified files

## Known Residual Risks

- `failWhenNoTargetsResolved: false` sessions will silently return `false` for all `isAssignableTo` calls (acceptable; previous behavior silently returned `undefined` maps)
- `WeakMap` entries are only collectible when TypeNode objects are GC'd; long-lived sessions holding snapshots will retain the mapping (same lifetime as existing snapshot cache)

## Follow-up Recommendations

- Add `param` and `property` projection test cases when those paths are exercised by real consumers
- Consider adding `api.hasTarget(targetId): boolean` for consumers that need to distinguish "target not resolved" from "not assignable"

## Workflow Ownership Outcome

- Active workflow: `20260224-2130-composable-type-projections`
- No explicit reuse override

## Memory Outcomes

- Short-term: brainstorming, research, requirements, spec, and plan captured in workflow
- Promoted: none (deferring until pattern proves stable across multiple consumers)
- Deferred: updating `.docs/_meta/memory/typeinfoapi-structural-type-targets.md` — will do once the API is exercised in production

## PR

https://github.com/TylorS/typed-smol/pull/1
