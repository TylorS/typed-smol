---
name: effect-module-unstable-observability
description: Guidance for `effect/unstable/observability` focused on APIs like Otlp, OtlpLogger, and OtlpTracer. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/observability

## Owned scope

- Owns only `effect/unstable/observability`.
- Source of truth: `packages/effect/src/unstable/observability/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Otlp`
- `OtlpLogger`
- `OtlpTracer`
- `OtlpMetrics`
- `OtlpExporter`
- `OtlpResource`
- `OtlpSerialization`
- `PrometheusMetrics`
- Full API list: `references/api-reference.md`

## How to use it

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

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-observability-otlp` (effect/unstable/observability/Otlp)
  - `effect-facet-unstable-observability-otlpexporter` (effect/unstable/observability/OtlpExporter)
  - `effect-facet-unstable-observability-otlplogger` (effect/unstable/observability/OtlpLogger)
  - `effect-facet-unstable-observability-otlpmetrics` (effect/unstable/observability/OtlpMetrics)
  - `effect-facet-unstable-observability-otlpresource` (effect/unstable/observability/OtlpResource)
  - `effect-facet-unstable-observability-otlpserialization` (effect/unstable/observability/OtlpSerialization)
  - `effect-facet-unstable-observability-otlptracer` (effect/unstable/observability/OtlpTracer)
  - `effect-facet-unstable-observability-prometheusmetrics` (effect/unstable/observability/PrometheusMetrics)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-observability-otlp`.

## Reference anchors

- Module source: `packages/effect/src/unstable/observability/index.ts`
- Representative tests: `packages/effect/test/unstable/observability/OtlpMetrics.test.ts`
- Representative tests: `packages/effect/test/unstable/observability/PrometheusMetrics.test.ts`
- Representative tests: `packages/effect/test/Tracer.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
