# Requirements: Composable Type Projections

Revised from brainstorming per user feedback: projection should NOT be on TypeTargetSpec. Instead, `TypeInfoApi` exposes a dynamic `isAssignableTo(node, targetId, projection?)` method that plugins call at query time. TypeTargetSpec stays as pure target resolution. This lets the same target be reused in many composable ways.

## Functional Requirements

- **FR-1**: `TypeInfoApi` SHALL expose an `isAssignableTo(node: TypeNode, targetId: string, projection?: readonly TypeProjectionStep[]): boolean` method that performs structural assignability checking at query time.

- **FR-2**: A `WeakMap<TypeNode, ts.Type>` SHALL be maintained per session, mapping every TypeNode created during serialization to its source `ts.Type`. This includes all nested nodes (union elements, function params, return types, type arguments, object properties, etc.).

- **FR-3**: `TypeProjectionStep` SHALL be a discriminated union with these step kinds:
  - `{ kind: "returnType" }` — navigate to the return type of a call signature
  - `{ kind: "param", index: number }` — navigate to the nth parameter type
  - `{ kind: "typeArg", index: number }` — navigate to the nth type argument
  - `{ kind: "property", name: string }` — navigate to a named property's type
    Projection steps chain left-to-right. No projection means check the node's type directly against the target.

- **FR-4**: When a projection step fails (e.g. `returnType` on a non-callable, `typeArg[3]` when only 2 args exist, `property("x")` when no such property), `isAssignableTo` SHALL return `false`.

- **FR-5**: When `isAssignableTo` is called with a `TypeNode` not present in the WeakMap (e.g. a node constructed by the plugin, not originating from the API), it SHALL return `false`.

- **FR-6**: `ExportedTypeInfo` SHALL remove the fields `assignableTo`, `returnTypeAssignableTo`, `firstParamAssignableTo`, and `returnTypeEffectSuccessAssignableTo`. All assignability checks move to the dynamic API.

- **FR-7**: `TypeTargetSpec` SHALL remain unchanged (no `projection` field). It defines only target type resolution.

- **FR-8**: `TypeProjectionStep` and the `isAssignableTo` method SHALL be exported from `@typed/virtual-modules` public API.

- **FR-9**: All existing consumers (`routeTypeNode.ts`, `buildRouteDescriptors.ts`, `HttpApiVirtualModulePlugin.ts`) SHALL be migrated to use `api.isAssignableTo(...)` instead of reading pre-computed assignability maps.

- **FR-10**: `typeTargetSpecs.ts` (ROUTER_TYPE_TARGET_SPECS, HTTPAPI_TYPE_TARGET_SPECS) SHALL remain as-is; projected specs are NOT added (projection is query-time now).

## Non-Functional Requirements

- **NFR-1**: `isAssignableTo` SHALL be synchronous (same as all TypeInfoApi methods).

- **NFR-2**: The WeakMap registration SHALL NOT materially increase memory pressure. TypeNode objects already exist; WeakMap entries are collected when nodes are GC'd.

- **NFR-3**: Per-call latency of `isAssignableTo` SHALL be comparable to the current `checker.isTypeAssignableTo` call (projection adds at most a handful of type-navigation steps before the check).

- **NFR-4**: The projection step vocabulary SHALL be extensible (new step kinds can be added without breaking existing consumers).

## Acceptance Criteria

- **AC-1** (FR-1, FR-3): A plugin can call `api.isAssignableTo(exp.type, "Fx")` for a direct check and `api.isAssignableTo(exp.type, "Option", [{ kind: "returnType" }, { kind: "typeArg", index: 0 }])` for a composed check, and both return correct results.

- **AC-2** (FR-2): Sub-nodes of a TypeNode (e.g. `functionNode.returnType`, `referenceNode.typeArguments[0]`) can be passed directly to `isAssignableTo` and yield correct results (because they were registered in the WeakMap during serialization).

- **AC-3** (FR-4): `api.isAssignableTo(nonFunctionNode, "Effect", [{ kind: "returnType" }])` returns `false` (projection fails gracefully).

- **AC-4** (FR-5): A TypeNode constructed by the plugin (not from the API) returns `false` when passed to `isAssignableTo`.

- **AC-5** (FR-6): `ExportedTypeInfo` no longer contains `assignableTo`, `returnTypeAssignableTo`, `firstParamAssignableTo`, or `returnTypeEffectSuccessAssignableTo`.

- **AC-6** (FR-9): All existing tests pass after consumer migration (with updated assertions reflecting the new API).

- **AC-7** (NFR-1): `isAssignableTo` does not return a Promise or require await.

## Prioritization

- **must_have**: FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, NFR-1
- **should_have**: NFR-2, NFR-3, NFR-4, FR-10
- **could_have**: AC-4 (edge case test for plugin-constructed nodes)
