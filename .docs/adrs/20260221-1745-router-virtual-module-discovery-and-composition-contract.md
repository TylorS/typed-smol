## Status

proposed

## Context

The router virtual-module plugin needs durable, testable conventions for:

- route discovery from filesystem sources,
- type-safe route contract validation,
- hierarchical concern composition aligned with `Matcher`,
- deterministic generation behavior across platforms.

Prior draft assumptions used filename conventions (for example `*.route.ts`), but the approved requirements now mandate discovery from regular `*.ts` files validated through `TypeInfoApi`.

## Decision

Adopt the following contract for router virtual-module generation:

1. Discover candidates from regular `*.ts` files, not special route filename conventions.
2. Validate route candidacy through `TypeInfoApi` contract checks:
   - `route` export assignable to `Route.Any`,
   - exactly one of `handler`, `template`, `default`.
3. Resolve optional concerns from sibling and directory companion files:
   - sibling: `*.guard.ts`, `*.dependencies.ts`, `*.layout.ts`, `*.catch.ts`,
   - directory: `_guard.ts`, `_dependencies.ts`, `_layout.ts`, `_catch.ts`.
4. Compose concerns ancestor->leaf in `Matcher`-aligned order:
   - guard AND-composition,
   - dependencies concatenation,
   - layouts and catches outer-to-inner.
5. Classify entrypoints as `fx|effect|stream|plain` and pre-lift plain values into `Fx` at generation time.
6. Keep the full pipeline synchronous and deterministic, with structured diagnostics and non-crashing host outcomes.

## Consequences

Positive:

- Aligns route discovery with real TypeScript contracts instead of filename heuristics.
- Improves correctness and DX by surfacing contract errors with explicit diagnostics.
- Reduces runtime overhead through generation-time plain-value lifting.
- Keeps behavior consistent with `@typed/virtual-modules` and `Matcher` semantics.

Trade-offs:

- Type-based discovery/classification increases validation complexity.
- Classification rules require careful maintenance as type shapes evolve.
- Additional deterministic ordering and ambiguity checks increase implementation/test surface.

## Alternatives considered

1. **`*.route.ts` convention-first discovery**
   - Rejected: conflicts with approved requirement to discover regular `*.ts` files.
2. **Runtime classification/wrapping of entrypoints**
   - Rejected: contradicts optimization goal to pre-lift plain values during generation.
3. **Leaf-only concern modules (no ancestor composition)**
   - Rejected: does not match required hierarchical `Matcher` behavior.

## References

- `.docs/specs/router-virtual-module-plugin/requirements.md`
- `.docs/specs/router-virtual-module-plugin/spec.md`
- `.docs/specs/virtual-modules/spec.md`
- `.docs/adrs/20260220-2245-virtual-modules-sync-core-and-loaders.md`
- `packages/router/src/Matcher.ts`
