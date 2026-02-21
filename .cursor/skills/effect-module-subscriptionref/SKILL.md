---
name: effect-module-subscriptionref
description: Guidance for `effect/SubscriptionRef` focused on APIs like get, set, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module SubscriptionRef

## Owned scope

- Owns only `effect/SubscriptionRef`.
- Source of truth: `packages/effect/src/SubscriptionRef.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `set`
- `make`
- `update`
- `getAndSet`
- `setAndGet`
- `updateSome`
- `getAndUpdate`
- `updateAndGet`
- `updateEffect`
- `getAndUpdateEffect`
- `getAndUpdateSome`
- `getAndUpdateSomeEffect`
- `updateAndGetEffect`
- `updateSomeAndGet`
- `updateSomeAndGetEffect`
- `updateSomeEffect`
- `getUnsafe`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/SubscriptionRef.ts`
- Representative tests: `packages/effect/test/SubscriptionRef.test.ts`
- Representative tests: `packages/effect/test/reactivity/Atom.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
