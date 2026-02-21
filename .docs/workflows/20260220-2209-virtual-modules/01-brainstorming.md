## Problem Statement

Design and implement `@typed/virtual-modules` in `packages/virtual-modules` to enable synchronous, type-safe virtual module resolution and source generation for TypeScript workflows. The package must support both in-editor use via Language Service plugin integration and a `tsc`-like type-checking CLI workflow.

## Desired Outcomes

- Provide a small plugin interface for resolving/building virtual modules.
- Keep all plugin hooks synchronous.
- Support first-match plugin composition.
- Provide rich, JSON-like type information to plugins without exposing raw TypeScript APIs as the primary UX.
- Offer an API layer that can be used by both Language Service and Compiler/CLI integrations.

## Constraints and Assumptions

- Synchronous only: no Promise-based hooks.
- Plugin selection should start with `shouldResolve(id, importer): boolean`.
- First resolving plugin wins for initial version.
- Initial CLI scope is type-check only (no emit requirement).
- Type info passed to plugins should be rich, but still ergonomic and serializable.

## Known Unknowns and Risks

- Rich type extraction may be expensive if done repeatedly in large projects.
- TypeScript host integration points differ between Language Service and compiler host APIs; adapter design must avoid divergence.
- Some useful TypeScript metadata may not be trivially serializable.

## Candidate Approaches

### A) Raw TypeScript API-first plugin interface

- Pros: maximum power and flexibility.
- Cons: steep learning curve, leaks compiler internals, harder to keep stable.

### B) Adapter-first interface with JSON-like type snapshots and optional raw access

- Pros: ergonomic plugin UX, stable contracts, supports both LS and CLI integration, easier docs.
- Cons: requires careful adapter design and extraction performance strategy.

### C) Build-string-only interface with minimal metadata

- Pros: very simple API surface.
- Cons: too limited for rich type-aware generation and diagnostics.

## Recommendation

Use approach **B**: provide an adapter-first API with:

1. `shouldResolve(id, importer)` for routing.
2. `build(...)` to produce module source synchronously.
3. Rich JSON-like type snapshot input with stable shapes (plus optional escape hatch to raw TypeScript objects for advanced use).
4. A plugin manager that enforces first-match semantics and shared behavior across LS and CLI adapters.

## Source Grounding

- consulted_specs: none found (no `.docs/specs/` present yet)
- consulted_adrs: none found (no `.docs/adrs/` present yet)
- consulted_workflows:
  - `.docs/workflows/20260220-2209-virtual-modules/00-workflow-init.md`
- codebase package conventions consulted:
  - `packages/id/package.json`
  - `packages/template/package.json`
  - `tsconfig.base.json`

## Initial Memory Strategy

- Short-term capture during execution in:
  - `.docs/workflows/20260220-2209-virtual-modules/memory/inbox.md`
  - `.docs/workflows/20260220-2209-virtual-modules/memory/episodes.md`
- Promote only durable API design heuristics (evidence-backed) to `.docs/_meta/memory/` during finalization.

