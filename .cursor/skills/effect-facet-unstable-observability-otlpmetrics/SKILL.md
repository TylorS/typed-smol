---
name: effect-facet-unstable-observability-otlpmetrics
description: Guidance for facet `effect/unstable/observability/OtlpMetrics` focused on APIs like make, layer, and MetricsData. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/observability/OtlpMetrics

## Owned scope

- Owns only `effect/unstable/observability/OtlpMetrics`.
- Parent module: `effect/unstable/observability`.
- Source anchor: `packages/effect/src/unstable/observability/OtlpMetrics.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `layer`
- `MetricsData`
- `AggregationTemporality`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import * as OtlpMetrics from "effect/unstable/observability/OtlpMetrics";

// Use delta temporality for backends that prefer it (e.g., Datadog, Dynatrace)
const metricsLayer = OtlpMetrics.layer({
  url: "http://localhost:4318/v1/metrics",
  temporality: "delta",
});

// Use cumulative temporality for backends like Prometheus
const cumulativeLayer = OtlpMetrics.layer({
  url: "http://localhost:4318/v1/metrics",
  temporality: "cumulative", // This is the default
});
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-observability-otlp` (effect/unstable/observability/Otlp)
  - `effect-facet-unstable-observability-otlpexporter` (effect/unstable/observability/OtlpExporter)
  - `effect-facet-unstable-observability-otlplogger` (effect/unstable/observability/OtlpLogger)
  - `effect-facet-unstable-observability-otlpresource` (effect/unstable/observability/OtlpResource)
  - `effect-facet-unstable-observability-otlpserialization` (effect/unstable/observability/OtlpSerialization)
  - `effect-facet-unstable-observability-otlptracer` (effect/unstable/observability/OtlpTracer)
  - `effect-facet-unstable-observability-prometheusmetrics` (effect/unstable/observability/PrometheusMetrics)
- Parent module ownership belongs to `effect-module-unstable-observability`.

## Escalate to

- `effect-module-unstable-observability` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/observability/OtlpMetrics.ts`
- Parent tests: `packages/effect/test/unstable/observability/OtlpMetrics.test.ts`
- Parent tests: `packages/effect/test/unstable/observability/PrometheusMetrics.test.ts`
- Parent tests: `packages/effect/test/Tracer.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
