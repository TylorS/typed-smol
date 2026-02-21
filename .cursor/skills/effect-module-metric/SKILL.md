---
name: effect-module-metric
description: Guidance for `effect/Metric` focused on APIs like update, mapInput, and isMetric. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Metric

## Owned scope

- Owns only `effect/Metric`.
- Source of truth: `packages/effect/src/Metric.ts`.

## What it is for

- The `Metric` module provides a comprehensive system for collecting, aggregating, and observing application metrics in Effect applications. It offers type-safe, concurrent metrics that can be used to monitor performance, track business metrics, and gain insights into application behavior.

## API quick reference

- `update`
- `mapInput`
- `isMetric`
- `dump`
- `Type`
- `gauge`
- `Gauge`
- `Hooks`
- `Input`
- `State`
- `timer`
- `value`
- `Metric`
- `modify`
- `counter`
- `Counter`
- `summary`
- `Summary`
- Full API list: `references/api-reference.md`

## How to use it

- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, Metric } from "effect";

// Create metrics
const requestCount = Metric.counter("http_requests_total", {
  description: "Total number of HTTP requests",
});

const responseTime = Metric.histogram("http_response_time", {
  description: "HTTP response time in milliseconds",
  boundaries: Metric.linearBoundaries({ start: 0, width: 50, count: 20 }),
});

// Use metrics in your application
const handleRequest = Effect.gen(function* () {
  yield* Metric.update(requestCount, 1);

  const startTime = yield* Effect.clockWith((clock) => clock.currentTimeMillis);

  // Process request...
  yield* Effect.sleep("100 millis");

  const endTime = yield* Effect.clockWith((clock) => clock.currentTimeMillis);
  yield* Metric.update(responseTime, endTime - startTime);
});
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Metric.ts`
- Representative tests: `packages/effect/test/Metric.test.ts`
- Representative tests: `packages/effect/test/unstable/observability/OtlpMetrics.test.ts`
- Representative tests: `packages/effect/test/unstable/observability/PrometheusMetrics.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
