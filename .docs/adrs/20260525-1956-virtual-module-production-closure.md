# ADR: Virtual Module Production Output Uses Combined Dependency Closure

Status: proposed

## Context

Production virtual-module output must include only imports and generated surfaces consumed by user code and their required dependencies. The repository already has requested-export analysis, artifact manifests, TypeInfo dependency descriptors, and route/app graph facts in progress. Bundler tree-shaking alone is not enough because unused generated code can still introduce stale type errors, server-only imports, or unsafe helper types before bundling.

## Decision

Production virtual-module generation uses a combined dependency-closure model:

- requested exports from user import usage;
- plugin-declared internal dependencies needed by those exports;
- TypeInfo-discovered reachable facts;
- route/app graph reachability where a plugin participates in app structure.

Plugins may fail closed to all-output only for documented unanalyzable import shapes or missing correctness data. The fallback reason must be inspectable and test-covered.

## Consequences

- First-party plugins share one pruning contract instead of local heuristics.
- Generated source becomes smaller and safer before Rollup/Vite tree-shaking.
- Plugins need conformance tests for requested exports, dependency closure, and conservative fallback cases.
- The virtual-module core must expose enough context for plugins without making every plugin understand every graph.

## Alternatives Considered

1. Direct import usage only.
   - Rejected because requested names alone cannot prove internal helper, route, app, or TypeInfo dependencies.
2. Plugin-declared dependencies only.
   - Rejected because it misses graph reachability and encourages each plugin to duplicate analysis.
3. Rely on bundler tree-shaking.
   - Rejected because type-check and server-only import failures can occur before tree-shaking.

## References

- `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/requirements.md`
- `.docs/workflows/20260525-1843-virtual-modules-pr-reduction/02-research.md`
- `.docs/specs/virtual-modules/spec.md`
- `.docs/specs/virtual-module-artifact-store/spec.md`
