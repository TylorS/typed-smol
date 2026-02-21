# Usage Reference: effect/testing/TestClock

- Import path: `effect/testing/TestClock`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Fiber, Option, pipe } from "effect"
import { TestClock } from "effect/testing"
import * as assert from "node:assert"

Effect.gen(function*() {
  const fiber = yield* pipe(
    Effect.sleep("5 minutes"),
    Effect.timeout("1 minute"),
    Effect.forkChild
  )
  yield* TestClock.adjust("1 minute")
  const result = yield* Fiber.join(fiber)
  assert.deepStrictEqual(result, Option.none())
})
```

## Test Anchors

- `packages/effect/test/TestClock.test.ts`
- `packages/effect/test/Resource.test.ts`
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/BigDecimal.test.ts`
- `packages/effect/test/Cache.test.ts`
- `packages/effect/test/Chunk.test.ts`

## Top Symbols In Anchored Tests

- `make` (373)
- `TestClock` (55)
- `adjust` (44)
- `setTime` (4)
