---
name: effect-facet-unstable-observability-prometheusmetrics
description: Guidance for facet `effect/unstable/observability/PrometheusMetrics` focused on APIs like layerHttp, format, and HttpOptions. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/observability/PrometheusMetrics

## Owned scope

- Owns only `effect/unstable/observability/PrometheusMetrics`.
- Parent module: `effect/unstable/observability`.
- Source anchor: `packages/effect/src/unstable/observability/PrometheusMetrics.ts`.

## What it is for

- Prometheus metrics exporter for Effect's Metric system.

## API quick reference

- `layerHttp`
- `format`
- `HttpOptions`
- `FormatOptions`
- `MetricNameMapper`
- `formatUnsafe`
- Full API list: `references/api-reference.md`

## How to use it

- Prefer pipe-based composition to keep transformations explicit and testable.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-observability-otlp` (effect/unstable/observability/Otlp)
  - `effect-facet-unstable-observability-otlpexporter` (effect/unstable/observability/OtlpExporter)
  - `effect-facet-unstable-observability-otlplogger` (effect/unstable/observability/OtlpLogger)
  - `effect-facet-unstable-observability-otlpmetrics` (effect/unstable/observability/OtlpMetrics)
  - `effect-facet-unstable-observability-otlpresource` (effect/unstable/observability/OtlpResource)
  - `effect-facet-unstable-observability-otlpserialization` (effect/unstable/observability/OtlpSerialization)
  - `effect-facet-unstable-observability-otlptracer` (effect/unstable/observability/OtlpTracer)
- Parent module ownership belongs to `effect-module-unstable-observability`.

## Escalate to

- `effect-module-unstable-observability` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/observability/PrometheusMetrics.ts`
- Parent tests: `packages/effect/test/unstable/observability/PrometheusMetrics.test.ts`
- Parent tests: `packages/effect/test/unstable/observability/OtlpMetrics.test.ts`
- Parent tests: `packages/effect/test/Tracer.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
