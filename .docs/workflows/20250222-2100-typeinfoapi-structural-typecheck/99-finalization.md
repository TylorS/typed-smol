# Finalization: TypeInfoApi structural type checking

## What Changed

### 1. TypeInfoApi extended (packages/virtual-modules)

- **ResolvedTypeTarget**: New interface `{ id: string; type: ts.Type }` for pre-resolved types.
- **CreateTypeInfoApiSessionOptions.typeTargets**: Optional array of ResolvedTypeTarget.
- **ExportedTypeInfo.assignableTo**: Optional `Record<string, boolean>` populated when typeTargets provided. Each export gets `assignableTo[id] = true` iff `checker.isTypeAssignableTo(exportType, targetType)`.
- **serializeExport** and **createFileSnapshot** now accept and use typeTargets; run assignability at export level only (no nested TypeNode assignableTo in v1).

### 2. resolveRouterTypeTargets helper (packages/app)

- New `packages/app/src/internal/resolveTypeTargets.ts`: `resolveRouterTypeTargets(program, ts)` scans source files for imports of @typed/fx, effect, @typed/router and returns ResolvedTypeTarget[] for Fx, Effect, Stream, Route, RefSubject, Option.
- Hosts (tests, ts-plugin, vite) should pass these when creating the session for router plugin.

### 3. Next steps (not yet implemented)

- **routeTypeNode**: Refactor to use `entrypoint.assignableTo` when present; remove string-based `getReferenceTypeName` / `runtimeKindFromTypeText` for Fx/Effect/Stream/Route.
- **RouterVirtualModulePlugin test**: Update `buildRouterFromFixture` to use `typeTargets: resolveRouterTypeTargets(program, ts)`.
- **virtual-modules-ts-plugin**: Update session factory to pass typeTargets for router: resolution.
- **Nested assignableTo**: For guard (Effect<Option<\*>>) and RefSubject param, extend serializeTypeNode to add assignableTo to nested TypeNodes when typeTargets provided. Requires threading typeTargets through serializeTypeNode.

## Validation Performed

- TypeScript compiles for virtual-modules and app packages.
- No runtime tests run (vitest env issue in app package).

## Known Residual Risks

- resolveRouterTypeTargets may fail to find types if no source file in the program imports @typed/fx/effect/@typed/router.
- Nested type assignability (guard return, RefSubject param) still uses string-based checks until assignableTo is extended to TypeNode.

## Follow-up Recommendations

1. Implement routeTypeNode refactor to use assignableTo; remove string checks.
2. Extend assignableTo to nested TypeNodes (serializeTypeNode) for full structural coverage.
3. Add EffectOption target (Effect<Option<unknown>>) for guard validation.
4. Document typeTargets requirement in Router plugin README and ts-plugin integration.

## Workflow Ownership Outcome

- active_workflow_slug: 20250222-2100-typeinfoapi-structural-typecheck
- explicit_reuse_override: false

## Memory Outcomes

- captured_short_term: 01-current-string-checks-audit.md, 02-design-structural-type-targets.md
- promoted_long_term: (below)
- deferred: Nested assignableTo, EffectOption target
