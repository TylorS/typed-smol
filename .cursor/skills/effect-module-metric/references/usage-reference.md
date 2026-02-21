# Usage Reference: effect/Metric

- Import path: `effect/Metric`

## What It Is For

The `Metric` module provides a comprehensive system for collecting, aggregating, and observing application metrics in Effect applications. It offers type-safe, concurrent metrics that can be used to monitor performance, track business metrics, and gain insights into application behavior.

## How To Use

- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Metric } from "effect"

// Create metrics
const requestCount = Metric.counter("http_requests_total", {
  description: "Total number of HTTP requests"
})

const responseTime = Metric.histogram("http_response_time", {
  description: "HTTP response time in milliseconds",
  boundaries: Metric.linearBoundaries({ start: 0, width: 50, count: 20 })
})

// Use metrics in your application
const handleRequest = Effect.gen(function*() {
  yield* Metric.update(requestCount, 1)

  const startTime = yield* Effect.clockWith((clock) => clock.currentTimeMillis)

  // Process request...
  yield* Effect.sleep("100 millis")

  const endTime = yield* Effect.clockWith((clock) => clock.currentTimeMillis)
  yield* Metric.update(responseTime, endTime - startTime)
})
```

## Test Anchors

- `packages/effect/test/Metric.test.ts`
- `packages/effect/test/unstable/observability/OtlpMetrics.test.ts`
- `packages/effect/test/unstable/observability/PrometheusMetrics.test.ts`

## Top Symbols In Anchored Tests

- `Metric` (262)
- `counter` (176)
- `value` (94)
- `gauge` (78)
- `update` (73)
- `histogram` (49)
- `frequency` (42)
- `summary` (41)
- `withConstantInput` (31)
- `withAttributes` (30)
- `Counter` (7)
- `Gauge` (6)
- `Frequency` (5)
- `Histogram` (5)
- `Summary` (5)
