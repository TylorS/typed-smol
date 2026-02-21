# Usage Reference: effect/unstable/observability/OtlpMetrics

- Import path: `effect/unstable/observability/OtlpMetrics`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as OtlpMetrics from "effect/unstable/observability/OtlpMetrics"

// Use delta temporality for backends that prefer it (e.g., Datadog, Dynatrace)
const metricsLayer = OtlpMetrics.layer({
  url: "http://localhost:4318/v1/metrics",
  temporality: "delta"
})

// Use cumulative temporality for backends like Prometheus
const cumulativeLayer = OtlpMetrics.layer({
  url: "http://localhost:4318/v1/metrics",
  temporality: "cumulative" // This is the default
})
```

## Test Anchors

- `packages/effect/test/unstable/observability/OtlpMetrics.test.ts`
- `packages/effect/test/unstable/observability/PrometheusMetrics.test.ts`
- `packages/effect/test/Tracer.test.ts`

## Top Symbols In Anchored Tests

- `layer` (10)
- `make` (3)
