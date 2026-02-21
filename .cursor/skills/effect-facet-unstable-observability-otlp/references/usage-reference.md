# Usage Reference: effect/unstable/observability/Otlp

- Import path: `effect/unstable/observability/Otlp`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Otlp } from "effect/unstable/observability/Otlp"

const value = Otlp.layer()
```

## Test Anchors

- `packages/effect/test/unstable/observability/OtlpMetrics.test.ts`
- `packages/effect/test/unstable/observability/PrometheusMetrics.test.ts`
- `packages/effect/test/Tracer.test.ts`

## Top Symbols In Anchored Tests

- `layer` (10)
- `layerJson` (3)
