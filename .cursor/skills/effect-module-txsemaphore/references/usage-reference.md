# Usage Reference: effect/TxSemaphore

- Import path: `effect/TxSemaphore`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, TxSemaphore } from "effect";

// Create a semaphore with 3 permits for managing concurrent database connections
const program = Effect.gen(function* () {
  const dbSemaphore = yield* TxSemaphore.make(3);

  // Acquire a permit before accessing the database
  yield* TxSemaphore.acquire(dbSemaphore);
  console.log("Database connection acquired");

  // Perform database operations...

  // Release the permit when done
  yield* TxSemaphore.release(dbSemaphore);
  console.log("Database connection released");
});
```

## Test Anchors

- `packages/effect/test/TxSemaphore.test.ts`

## Top Symbols In Anchored Tests

- `TxSemaphore` (75)
- `available` (53)
- `make` (24)
- `capacity` (12)
- `releaseN` (8)
- `acquire` (7)
- `acquireN` (6)
- `release` (6)
- `isTxSemaphore` (5)
- `withPermit` (5)
- `tryAcquire` (4)
- `tryAcquireN` (4)
- `withPermits` (2)
- `withPermitScoped` (2)
