---
name: effect-module-txsemaphore
description: Guidance for `effect/TxSemaphore` focused on APIs like make, isTxSemaphore, and acquire. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module TxSemaphore

## Owned scope

- Owns only `effect/TxSemaphore`.
- Source of truth: `packages/effect/src/TxSemaphore.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `isTxSemaphore`
- `acquire`
- `release`
- `acquireN`
- `capacity`
- `releaseN`
- `available`
- `tryAcquire`
- `withPermit`
- `tryAcquireN`
- `TxSemaphore`
- `withPermits`
- `withPermitScoped`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Effect, TxSemaphore } from "effect"

// Create a semaphore with 3 permits for managing concurrent database connections
const program = Effect.gen(function*() {
  const dbSemaphore = yield* TxSemaphore.make(3)

  // Acquire a permit before accessing the database
  yield* TxSemaphore.acquire(dbSemaphore)
  console.log("Database connection acquired")

  // Perform database operations...

  // Release the permit when done
  yield* TxSemaphore.release(dbSemaphore)
  console.log("Database connection released")
})
```

## Common pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/TxSemaphore.ts`
- Representative tests: `packages/effect/test/TxSemaphore.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
