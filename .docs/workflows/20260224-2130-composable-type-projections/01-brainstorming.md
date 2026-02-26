# Brainstorming: Composable Type Projections

## Problem Statement

`ExportedTypeInfo` has four hardcoded assignability maps:

- `assignableTo` — checks the export's own type against each target
- `returnTypeAssignableTo` — function return type against each target
- `firstParamAssignableTo` — first parameter type against each target
- `returnTypeEffectSuccessAssignableTo` — first type argument of the return type (Effect\<A,E,R\> → A) against each target

These are computed in `serializeExport()` (TypeInfoApi.ts:811-895) with baked-in extraction logic: "get return type", "get first param", "get first type arg of return type". Adding a new extraction path (e.g. second param, second type arg, property type, nested generic) requires modifying TypeInfoApi internals, the ExportedTypeInfo interface, and all consumers.

The user wants to express patterns like `Fx<*TARGET, *, *>` or `Stream<*TARGET, *, *>` — "extract the first type argument and check it against TARGET" — without modifying the API surface. The system should be composable and open.

## Desired Outcomes

1. **One unified `assignableTo` map** — eliminate `returnTypeAssignableTo`, `firstParamAssignableTo`, `returnTypeEffectSuccessAssignableTo`.
2. **Declarative type projections** — plugins describe how to navigate from an export's type to a sub-type before the assignability check.
3. **Composable steps** — projections chain: `returnType → typeArg[0]` is "extract first type arg of the return type"; `param[1] → typeArg[2]` is "extract third type arg of the second parameter".
4. **Backward-compatible target resolution** — existing `TypeTargetSpec` without projections continues to mean "check the export type directly".
5. **No new runtime concepts** — projection is metadata on the spec; TypeInfoApi applies it internally using the same `ts.Type` + `checker` it already has.

## Constraints and Assumptions

- TypeInfoApi is synchronous; projection must be resolved at check time using `ts.Type` navigation (no async).
- Projections operate on `ts.Type` objects, not serialized `TypeNode` — TypeNode is the output, not the query input.
- The `TypeTargetSpec.id` field serves as the key in `assignableTo`; consumers already use string keys.
- Consumers (routeTypeNode.ts, buildRouteDescriptors.ts, HttpApiVirtualModulePlugin.ts) must be migrated to new query IDs.
- Bootstrap content generation (`createTypeTargetBootstrapContent`) dedupes by `module`; adding projected specs for the same module shouldn't add redundant imports.

## Known Unknowns and Risks

1. **Projection failure semantics**: If a projection step fails (e.g. "get returnType" on a non-function), should the check return `false` or be omitted from the map? Recommend: return `false` (not assignable when projection doesn't apply).
2. **Performance**: More specs × more projections = more `isAssignableTo` calls. Current system: `4 × N` checks per export (for N targets). New system: `M` checks (one per spec). Should be comparable or better since plugins will only declare the checks they need.
3. **Naming convention for query IDs**: Need a convention that's readable at consumption sites. E.g. `"returnType:Effect"`, `"param.0:RefSubject"`, `"returnType.typeArg.0:Option"`.
4. **Multiple specs same target type**: A plugin may want `Fx` (direct) and `returnType:Fx` (return type check). Both resolve the same module type but differ by projection. Resolution should be deduplicated internally by `(module, exportName, typeMember)`.

## Candidate Approaches

### A: TypeProjectionStep on TypeTargetSpec (Recommended)

Add a `projection?: readonly TypeProjectionStep[]` field to `TypeTargetSpec`. Each step navigates from one `ts.Type` to a sub-type. Steps chain left-to-right. No projection = check the export type directly.

```ts
type TypeProjectionStep =
  | { readonly kind: "returnType" }
  | { readonly kind: "param"; readonly index: number }
  | { readonly kind: "typeArg"; readonly index: number }
  | { readonly kind: "property"; readonly name: string };

interface TypeTargetSpec {
  readonly id: string;
  readonly module: string;
  readonly exportName: string;
  readonly typeMember?: string;
  readonly projection?: readonly TypeProjectionStep[];
}
```

**Pros**: Declarative, serializable, simple to implement (4 projection kinds cover all current + foreseeable uses), no new interfaces on ExportedTypeInfo.

**Cons**: Projection vocabulary is fixed (but extensible by adding new step kinds).

### B: Separate TypeQuery + TypeTargetSpec

Split targets (what to resolve) from queries (what to check):

```ts
interface TypeTargetSpec {
  id: string;
  module: string;
  exportName: string;
  typeMember?: string;
}
interface TypeQuery {
  id: string;
  targetId: string;
  projection?: readonly TypeProjectionStep[];
}
```

Plugin declares both. TypeInfoApi resolves targets once, then applies each query.

**Pros**: No redundant type resolution when multiple projections reference the same target. Cleaner conceptual separation.

**Cons**: Two concepts to declare and merge. More verbose plugin API. Requires linking queries to targets by ID.

### C: Callback-based TypeAccessor

Plugins provide functions that receive a fluent TypeAccessor API:

```ts
interface TypeAccessor {
  isAssignableTo(targetId: string): boolean;
  returnType(): TypeAccessor | undefined;
  param(index: number): TypeAccessor | undefined;
  typeArg(index: number): TypeAccessor | undefined;
}
```

**Pros**: Maximum flexibility — plugins can express any logic.

**Cons**: Functions aren't serializable (breaks compiler/plugin boundary). Harder to analyze statically. More complex implementation.

## Recommendation

**Approach A** — TypeProjectionStep on TypeTargetSpec. It gives composability with minimal API surface change. The projection DSL is small (4 step kinds), declarative, and covers the `Fx<*TARGET, *, *>` pattern directly as `projection: [{ kind: "typeArg", index: 0 }]`. Internal resolution deduplication handles the "same module resolved multiple times" concern.

For the `Fx<*TARGET, *, *>` example:

```ts
{ id: "Fx.success:Option", module: "effect/Option", exportName: "Option", projection: [{ kind: "typeArg", index: 0 }] }
```

Read as: "from the export type, extract typeArg[0], then check if it's assignable to Option".

Combined with `{ id: "Fx", module: "@typed/fx/Fx", exportName: "Fx" }` (no projection), the plugin can check:

- `assignableTo.Fx` — is this an Fx?
- `assignableTo["Fx.success:Option"]` — is the first type arg assignable to Option?

## Source Grounding

- consulted_specs: `.docs/specs/virtual-modules/spec.md`
- consulted_adrs: none directly modified
- consulted_workflows:
  - `.docs/workflows/20250222-2100-typeinfoapi-structural-typecheck/memory/02-design-structural-type-targets.md` — original design rationale for pre-resolved type targets
  - `.docs/workflows/20260224-1542-httpapi-assignableto/99-finalization.md` — recent assignability implementation
  - `.docs/workflows/20260224-2000-typeinfoapi-production-improvements/00-plan.md` — production improvements plan
- consulted_memory: `.docs/_meta/memory/typeinfoapi-structural-type-targets.md` — structural checking rule

## Initial Memory Strategy

- Short-term: capture projection step vocabulary decisions in `workflows/<slug>/memory/`
- Promotion: if this pattern proves stable, promote the projection vocabulary and naming convention to `.docs/_meta/memory/`
