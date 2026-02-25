# Research: Composable Type Projections

## Research Questions

| RQ | Question | Status |
|----|----------|--------|
| 1  | Does the TS checker API support all four projection step kinds? | Confirmed |
| 2  | What is the full consumer migration surface? | Mapped |
| 3  | Does bootstrap deduplication work with projected specs sharing same module? | Confirmed |

## RQ1: TypeScript Checker API Support

Each projection step maps to existing TypeScript checker API methods already used in `TypeInfoApi.ts`:

| Step Kind | TS API | Already Used? |
|-----------|--------|---------------|
| `returnType` | `checker.getSignaturesOfType(type, Call)` → `checker.getReturnTypeOfSignature(sig)` | Yes (L846-849) |
| `param` | `sig.getParameters()[index]` → `checker.getTypeOfSymbolAtLocation(param, decl)` | Yes (L856-862) |
| `typeArg` | `checker.getTypeArguments(type as TypeReference)[index]` | Yes (L803) |
| `property` | `type.getProperty(name)` → `checker.getTypeOfSymbolAtLocation(prop, decl)` | No, but standard public API |

**Finding**: All four projection kinds use public or already-used checker APIs. No new internal API dependency.

**`property` step**: Uses `ts.Type.getProperty(name)` which is a public API method on the `Type` interface. Combined with `checker.getTypeOfSymbolAtLocation`, this gives the property's type. This is new to TypeInfoApi but not internal.

## RQ2: Consumer Migration Surface

### Source files with hardcoded field references (code only, excluding tests and docs):

| File | Field | Usage | Migration |
|------|-------|-------|-----------|
| `types.ts` | `returnTypeAssignableTo` | Interface declaration | Remove field |
| `types.ts` | `firstParamAssignableTo` | Interface declaration | Remove field |
| `types.ts` | `returnTypeEffectSuccessAssignableTo` | Interface declaration | Remove field |
| `TypeInfoApi.ts` | All three | `serializeExport()` computes them (L841-878) | Replace with projection loop |
| `TypeInfoApi.ts` | `getFirstTypeArgument` | Helper for effect success (L796-809) | Generalized into `applyProjection` |
| `routeTypeNode.ts` | `firstParamAssignableTo` | `firstParamIsRefSubject`, `firstParamIsCause`, `typeNodeExpectsRefSubjectParam` | Change to `assignableTo["param.0:RefSubject"]` etc. |
| `routeTypeNode.ts` | `returnTypeEffectSuccessAssignableTo` | `typeNodeIsEffectOptionReturn` | Change to `assignableTo["returnType.typeArg.0:Option"]` |
| `routeTypeNode.ts` | `returnTypeAssignableTo` | `classifyCatchForm` | Change to `assignableTo["returnType:Fx"]` etc. |
| `buildRouteDescriptors.ts` | `returnTypeAssignableTo` | `classifyEntrypointKind` (L118-119) | Use `assignableTo["returnType:Fx"]` etc. |
| `buildRouteDescriptors.ts` | `firstParamAssignableTo` | `typeNodeExpectsRefSubjectParam` (L268) | Passed through helper |
| `buildRouteDescriptors.ts` | `returnTypeEffectSuccessAssignableTo` | Guard validation (L334) | Passed through helper |
| `HttpApiVirtualModulePlugin.ts` | `returnTypeAssignableTo` | Handler return type check (L207-208) | Use `assignableTo["returnType:Effect"]` |
| `HttpApiVirtualModulePlugin.ts` | `returnTypeEffectSuccessAssignableTo` | Raw handler detection (L335) | Use `assignableTo["returnType.typeArg.0:HttpServerResponse"]` |

### Test files (need snapshot updates):

| File | Approximate refs |
|------|-----------------|
| `RouterVirtualModulePlugin.test.ts` | 10 |
| `HttpApiVirtualModulePlugin.test.ts` | 7 |

### Migration Difficulty: **Low-Medium**

- `routeTypeNode.ts` is the heaviest consumer (18 refs) but all are through helper functions; updating the helpers propagates changes to callers.
- `buildRouteDescriptors.ts` mostly calls `routeTypeNode.ts` helpers; 2-3 direct field accesses.
- `HttpApiVirtualModulePlugin.ts` has 2 direct field accesses.
- Test updates are mostly inline snapshot refreshes.

## RQ3: Bootstrap Deduplication

`createTypeTargetBootstrapContent` (L551-571) deduplicates by `spec.module`:

```ts
if (seen.has(spec.module)) continue;
seen.add(spec.module);
```

When the same type (e.g. `Option` from `effect/Option`) is referenced by multiple specs with different projections, the module is imported once. This works correctly because projection doesn't affect which modules need importing — it only affects how the export's type is navigated at check time.

**Finding**: No change needed to bootstrap. The `resolveTypeTargetsFromSpecs` function resolves by `spec.id` (which is unique per spec even with projections). Multiple specs for the same `(module, exportName, typeMember)` will redundantly resolve the same `ts.Type`, but this is harmless and can be optimized later with an internal cache keyed by `(module, exportName, typeMember)`.

## Key Findings

1. **All projection steps use public/existing checker APIs** — no new internal TS API coupling.
2. **Consumer migration is bounded** — `routeTypeNode.ts` helper functions are the natural abstraction layer; updating them propagates to all callers.
3. **Bootstrap is unaffected** — projection is a check-time concept, not a resolution-time concept.
4. **Performance is equivalent or better** — current system runs `4 × N` checks per export (for N targets); new system runs exactly the number of declared specs (plugins declare only what they need).
5. **Spec ID naming convention** is purely a consumer concern — TypeInfoApi doesn't interpret IDs, just uses them as map keys.

## Open Risks/Unknowns

1. **Projection failure**: When a step fails (e.g. `returnType` on a non-function), the result should be `false` (not assignable). Implementation needs try/catch around each step.
2. **Multiple call signatures**: `returnType` and `param` steps use the first call signature. This matches current behavior but should be documented.
3. **Deeply nested projections**: No theoretical limit, but in practice 2-3 steps is the max observed (e.g. `returnType → typeArg[0]`).

## Implications for Requirements and Specification

- **Types**: `TypeTargetSpec` gains `projection?: readonly TypeProjectionStep[]`. `ExportedTypeInfo` loses 3 fields.
- **TypeInfoApi**: `serializeExport` replaces 4 hardcoded extraction paths with a generic `applyProjection` loop.
- **Consumer migration**: `routeTypeNode.ts` helpers updated; `typeTargetSpecs.ts` specs expanded with projection-annotated entries.
- **Tests**: Inline snapshots will change (unified `assignableTo` keys); structural test logic unchanged.

## Alignment Notes

- `.docs/specs/virtual-modules/spec.md`: Mentions TypeInfoApi query model and type targets; will need a section update for projections.
- `.docs/_meta/memory/typeinfoapi-structural-type-targets.md`: Currently documents `assignableTo` as the single mechanism; aligns with unified approach.
- `.docs/workflows/20250222-2100-typeinfoapi-structural-typecheck/memory/02-design-structural-type-targets.md`: Original design chose Option A (pre-resolved types). Projections extend this without changing the resolution model.

## Memory Promotion Candidates

- **Procedural**: "Type projection vocabulary" — the four step kinds and their mapping to checker APIs. Confidence: high.
- **Heuristic**: "Projection specs should declare only the checks a plugin actually needs, not all possible combinations." Confidence: high.
