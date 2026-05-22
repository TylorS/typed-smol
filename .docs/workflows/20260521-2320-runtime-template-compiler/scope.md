# Scope

## In Scope

- Define the strict-mode workflow for runtime functions in `@typed/app` and compiler functionality exposed as `@typed/compiler`.
- Research existing code paths in:
  - `@typed/app`
  - `@typed/template`
  - `@typed/fx`
  - `@typed/virtual-modules`
  - `@typed/virtual-modules-compiler`
  - `@typed/vite-plugin`
- Research current 2026 Vite HMR and TypeScript/compiler constraints where they affect the design.
- Specify public runtime APIs for:
  - DOM rendering/hydration entrypoints.
  - Server rendering entrypoints.
  - Runtime/compiler handoff values.
  - Safe HMR state registration and restoration.
- Specify compiler responsibilities for:
  - Parsing/analyzing Typed templates.
  - Emitting server-optimized output.
  - Emitting DOM-optimized output.
  - Preserving type information from template inputs and `Effect` / `Fx` surfaces.
  - Integrating with the existing virtual-module artifact store where generated artifacts are needed.
- Specify HMR eligibility for `Fx.gen` / `Fx.fn` programs that use `RefSubject`.
- Implement sequential tasks only after requirements, specification, and plan are explicitly approved.

## Out of Scope For The First Approved Slice

- Actual filesystem routing.
- Replacing the existing virtual-module compiler substrate without a compatibility plan.
- Broad optimizer work for arbitrary TypeScript beyond Typed templates and Typed runtime handoff code.
- Production deployment adapters.
- Rewriting `@typed/template` rendering wholesale before a compiler contract is approved.
- Preserving arbitrary local variables across HMR reloads.
- Silent state preservation when compiler/runtime compatibility cannot be proven.

## Initial Package Boundary Assumptions

- `@typed/app` remains the application runtime and generated app-entrypoint integration layer.
- `@typed/template` remains the authoring and runtime template model.
- `@typed/fx` remains the source of `Fx` and `RefSubject`.
- `@typed/virtual-modules-compiler` remains the `vmc` TypeScript host/compiler adapter unless this workflow explicitly specifies a migration.
- `@typed/compiler` is initially assumed to be a new or facade package for Typed application/template compilation, not a replacement for every virtual-module host adapter.

## Known Unknowns

- Exact `@typed/compiler` package shape.
- Exact first optimization target.
- Whether HMR state keys should be compiler-generated, user-provided, module-derived, or a combination.
- Whether `Fx.fn` already exists in `@typed/fx` or must be introduced.
- How much Vite HMR integration belongs in `@typed/app` versus `@typed/vite-plugin`.
- How generated server/DOM outputs should be represented in the artifact store.

## Acceptance Shape

This phase is complete only when the human explicitly approves `intent.md` and `scope.md`. After approval, commit these documents and continue to requirements.
