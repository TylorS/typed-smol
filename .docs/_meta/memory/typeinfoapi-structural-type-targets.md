# TypeInfoApi: Use structural type targets, not string checks

**Rule**: Virtual module plugins MUST use strict structural type checking via TypeInfoApi. Do NOT use string-based type name parsing (e.g. `getReferenceTypeName(text)`, `name === "Fx"`).

## How to use structural checking

1. **Host** creates the TypeInfoApi session with `typeTargets`:
   - Resolve `ts.Type` for Fx, Effect, Stream, Route (etc.) from the program.
   - Use `resolveRouterTypeTargets(program, ts)` from @typed/app when using the Router plugin.
   - Pass `createTypeInfoApiSession({ ts, program, typeTargets })`.

2. **ExportedTypeInfo.assignableTo**: When typeTargets are provided, each export gets `assignableTo: { Fx?: boolean; Effect?: boolean; ... }` populated via `checker.isTypeAssignableTo()`.

3. **Plugin** uses `export.assignableTo?.Fx` etc. instead of parsing `export.type.text`.

## Reference

- Workflow: `.docs/workflows/20250222-2100-typeinfoapi-structural-typecheck/`
- API: `packages/virtual-modules/src/TypeInfoApi.ts` (ResolvedTypeTarget, typeTargets)
- Helper: `packages/app/src/internal/resolveTypeTargets.ts` (resolveRouterTypeTargets)
