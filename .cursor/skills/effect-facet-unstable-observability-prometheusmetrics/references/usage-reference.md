# Usage Reference: effect/unstable/observability/PrometheusMetrics

- Import path: `effect/unstable/observability/PrometheusMetrics`

## What It Is For

Prometheus metrics exporter for Effect's Metric system.

## How To Use

- Prefer pipe-based composition to keep transformations explicit and testable.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { Effect, Metric } from "effect";
import * as PrometheusMetrics from "effect/unstable/observability/PrometheusMetrics";

const program = Effect.gen(function* () {
  // Create and update metrics
  const counter = Metric.counter("http_requests_total", {
    description: "Total HTTP requests",
  });
  yield* Metric.update(counter, 42);

  // Format metrics for Prometheus
  const output = yield* PrometheusMetrics.format();
  console.log(output);
  // # HELP http_requests_total Total HTTP requests
  // # TYPE http_requests_total counter
  // http_requests_total 42
});
```

## Test Anchors

- `packages/effect/test/unstable/observability/PrometheusMetrics.test.ts`
- `packages/effect/test/unstable/observability/OtlpMetrics.test.ts`
- `packages/effect/test/Tracer.test.ts`

## Top Symbols In Anchored Tests

- `format` (27)
