# Memories

## Route Analyzer

- `@typed/compiler` now has a TypeScript AST-backed route analyzer in `packages/compiler/src/route/analyzeRouteModule.ts`.
- HMR component/dependency analysis should consume route analyzer facts instead of adding new regex scanners.
- Keep the analyzer tolerant of older fixture shapes like top-level parsed `yield* RefSubject.make(...)`, but do not treat that as the preferred source model.

## Resumability Model

- Typed's Qwik-like resumability path is virtual-module continuation descriptors, not QRL syntax.
- Route closures lower into `route-closure` CPS continuations with generated symbol ids, capture records, service ids, dependency fingerprints, template hashes, and compatibility fingerprints.
- `Effect.Context` captures and `RefSubject.Service` identities are the explicit state/dependency carriers. Hidden heap state should become a diagnostic.

## Recursive Dependencies

- Route dependency analysis needs deterministic recursive traversal.
- Explicit opt-out wins over inferred participation and stops traversal below that boundary.
- Cycles should be recorded as metadata and traversal must terminate deterministically.

## Runtime Registry

- `packages/app/src/runtime/hmrRegistry.ts` is the canonical HMR/resume registry.
- `packages/app/src/runtimeTemplates/hmrRegistry.ts` forwards to the canonical runtime registry.
- Compatibility fingerprints include generated symbol/capture/context/continuation data in addition to dependency and shape fingerprints.
