# Usage Reference: effect/Schedule#combinators

- Import path: `effect/Schedule#combinators`

## What It Is For

compose/andThen/while/until behavior. This module provides utilities for creating and composing schedules for retrying operations, repeating effects, and implementing various timing strategies.

## How To Use

- Keep work focused on the `combinators` concern for `effect/Schedule`.
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

## Top Symbols In Anchored Tests

- `andThen` (6)
- `andThenResult` (4)
