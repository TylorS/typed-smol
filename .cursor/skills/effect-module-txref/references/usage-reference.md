# Usage Reference: effect/TxRef

- Import path: `effect/TxRef`

## What It Is For

TxRef is a transactional value, it can be read and modified within the body of a transaction.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, TxRef } from "effect"

const program = Effect.gen(function*() {
  // Create a transactional reference
  const ref: TxRef.TxRef<number> = yield* TxRef.make(0)

  // Use within a transaction
  yield* Effect.atomic(Effect.gen(function*() {
    const current = yield* TxRef.get(ref)
    yield* TxRef.set(ref, current + 1)
  }))

  const final = yield* TxRef.get(ref)
  console.log(final) // 1
})
```

## Test Anchors

- `packages/effect/test/Effect.test.ts`

## Top Symbols In Anchored Tests

- `TxRef` (47)
- `make` (20)
- `set` (19)
- `get` (14)
