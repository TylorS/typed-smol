# Usage Reference: effect/Schedule

- Import path: `effect/Schedule`

## What It Is For

This module provides utilities for creating and composing schedules for retrying operations, repeating effects, and implementing various timing strategies.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Schedule } from "effect"

// Retry with exponential backoff
const retryPolicy = Schedule.exponential("100 millis", 2.0)
  .pipe(Schedule.compose(Schedule.recurs(3)))

const program = Effect.gen(function*() {
  // This will retry up to 3 times with exponential backoff
  const result = yield* Effect.retry(
    Effect.fail("Network error"),
    retryPolicy
  )
})

// Repeat on a fixed schedule
const heartbeat = Effect.log("heartbeat")
  .pipe(Effect.repeat(Schedule.spaced("30 seconds")))
```

## Test Anchors

- `packages/effect/test/Schedule.test.ts`
- `packages/effect/test/Resource.test.ts`
- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/Pool.test.ts`
- `packages/effect/test/Stream.test.ts`

## Top Symbols In Anchored Tests

- `Schedule` (94)
- `the` (44)
- `take` (40)
- `map` (36)
- `andThen` (34)
- `while` (29)
- `duration` (22)
- `spaced` (20)
- `forever` (16)
- `recurs` (15)
- `elapsed` (12)
- `delays` (11)
- `cron` (7)
- `fixed` (6)
- `jittered` (5)
