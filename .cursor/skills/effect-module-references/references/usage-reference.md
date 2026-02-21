# Usage Reference: effect/References

- Import path: `effect/References`

## What It Is For

This module provides a collection of reference implementations for commonly used Effect runtime configuration values. These references allow you to access and modify runtime behavior such as concurrency limits, scheduling policies, tracing configuration, and logging settings.

## How To Use

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, References } from "effect"

const limitConcurrency = Effect.gen(function*() {
  // Get current setting
  const current = yield* References.CurrentConcurrency
  console.log(current) // "unbounded" (default)

  // Run with limited concurrency
  yield* Effect.provideService(
    Effect.gen(function*() {
      const limited = yield* References.CurrentConcurrency
      console.log(limited) // 10
    }),
    References.CurrentConcurrency,
    10
  )

  // Run with unlimited concurrency
  yield* Effect.provideService(
    Effect.gen(function*() {
      const unlimited = yield* References.CurrentConcurrency
      console.log(unlimited) // "unbounded"
    }),
    References.CurrentConcurrency,
```

## Test Anchors

- `packages/effect/test/LogLevel.test.ts`
- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/Stream.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`

## Top Symbols In Anchored Tests

- `References` (18)
- `MinimumLogLevel` (5)
- `CurrentConcurrency` (4)
- `CurrentLogLevel` (4)
