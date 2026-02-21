# Usage Reference: effect/SubscriptionRef

- Import path: `effect/SubscriptionRef`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

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
import { Effect, Stream, SubscriptionRef } from "effect"

const program = Effect.gen(function*() {
  const ref = yield* SubscriptionRef.make(0)

  const stream = SubscriptionRef.changes(ref)

  const fiber = yield* Stream.runForEach(
    stream,
    (value) => Effect.sync(() => console.log("Value:", value))
  ).pipe(Effect.forkScoped)

  yield* SubscriptionRef.set(ref, 1)
  yield* SubscriptionRef.set(ref, 2)
})
```

## Test Anchors

- `packages/effect/test/SubscriptionRef.test.ts`
- `packages/effect/test/reactivity/Atom.test.ts`

## Top Symbols In Anchored Tests

- `get` (273)
- `make` (149)
- `set` (82)
- `SubscriptionRef` (29)
- `update` (14)
- `changes` (8)
