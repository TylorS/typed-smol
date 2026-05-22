## Problem Statement

Typed needs a first-class runtime/compiler story for app templates: public runtime functions in `@typed/app`, a compiler package surface in `@typed/compiler`, server and DOM optimized template output, and safe HMR state preservation for eligible `Fx.gen` / `Fx.fn` programs that use `RefSubject`.

## Desired Outcomes

- Clear package boundaries before implementation starts.
- A narrow first compiler/runtime slice that can be implemented and tested without weakening existing virtual-module guarantees.
- HMR state preservation rules that are explicit and testable.
- A research path that uses current code, current Vite/HMR behavior, and relevant compiler constraints.

## Constraints and Assumptions

- Strict mode and PR finalization are selected.
- Existing workflow folders are reference-only.
- Virtual modules remain the architecture filter.
- Actual filesystem routing remains out of scope.
- `@typed/app` emitted code must remain type-safe TypeScript.
- Effect-related claims must be routed through Effect skill ownership before implementation.
- The first slice should not overwrite unrelated dirty checkout changes.

## Known Unknowns and Risks

- `@typed/compiler` might mean a new package, a facade, or a renamed package.
- Template compiler scope could expand into a broad TypeScript optimizer unless constrained.
- HMR state preservation can create stale-state bugs if state shape changes across reloads.
- `Fx.fn` needs codebase confirmation before becoming a requirement.
- Server and DOM optimizations may need different artifact and runtime contracts.

## Candidate Approaches

### Approach A: New `@typed/compiler` Template Compiler Package

Create `@typed/compiler` as a focused template/app compiler that plugs into existing virtual-module hosts and Vite integration.

Pros:

- Clear public package name.
- Keeps `vmc` as the host/compiler adapter.
- Allows template optimization to evolve independently.

Cons:

- Adds a package and boundary decisions.
- Requires careful integration with artifact-store and Vite paths.

### Approach B: `@typed/compiler` Facade Over Existing Compiler Substrate

Expose `@typed/compiler` as the public compiler package while internally reusing `@typed/virtual-modules-compiler` and compiler helpers.

Pros:

- Faster package story.
- Preserves existing compiler investment.
- Could reduce naming confusion for users.

Cons:

- Risks overloading one package with both host adapter and template optimizer concerns.
- Could blur CLI/build versus template compile responsibilities.

### Approach C: Runtime-First Compiler Hooks In `@typed/app`

Add runtime functions and compiler hooks to `@typed/app` first, deferring a separate `@typed/compiler` package until the optimized output contract is proven.

Pros:

- Smallest initial implementation.
- Keeps public API close to generated app entrypoints.

Cons:

- Conflicts with the stated need for `@typed/compiler`.
- Risks growing `@typed/app` into both runtime and compiler implementation.

## Recommendation

Start with Approach A unless the requirements phase proves a facade is more useful. `@typed/compiler` should own template/app compilation contracts, while `@typed/app` owns runtime functions and generated runtime integration. The existing `@typed/virtual-modules-compiler` should remain the `vmc` host adapter unless a later approved requirement changes that.

## Source Grounding

- consulted_specs:
  - `.docs/specs/typed-framework-starter/spec.md`
  - `.docs/specs/virtual-modules/spec.md`
- consulted_adrs:
  - `.docs/adrs/20260516-1643-typed-framework-virtual-module-first.md`
  - `.docs/adrs/20260515-2018-virtual-module-artifact-store.md`
- consulted_workflows:
  - `.docs/workflows/20260515-2018-typed-framework-evolution/*`
  - `.docs/workflows/20260516-1600-typed-framework-starter/*`

## Initial Memory Strategy

- Capture workflow-local implementation lessons in `memories.md` during Phase 4.
- Promote only durable compiler/runtime constraints to `.docs/_meta/memory/` after finalization.
