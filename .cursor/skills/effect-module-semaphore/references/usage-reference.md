# Usage Reference: effect/Semaphore

- Import path: `effect/Semaphore`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Semaphore } from "effect"

// Create and use a semaphore for controlling concurrent access
const program = Effect.gen(function*() {
  const semaphore = yield* Semaphore.make(2)

  return yield* semaphore.withPermits(1)(
    Effect.succeed("Resource accessed")
  )
})
```

## Test Anchors

- `packages/effect/test/Semaphore.test.ts`

## Top Symbols In Anchored Tests

- `Semaphore` (15)
- `makePartitioned` (13)
