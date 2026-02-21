---
name: effect-module-queue
description: Guidance for `effect/Queue` focused on APIs like fail, make, and offer. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Queue

## Owned scope

- Owns only `effect/Queue`.
- Source of truth: `packages/effect/src/Queue.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `fail`
- `make`
- `offer`
- `offerAll`
- `failCause`
- `OfferEntry`
- `offerUnsafe`
- `failCauseUnsafe`
- `offerAllUnsafe`
- `isFull`
- `isQueue`
- `isDequeue`
- `isEnqueue`
- `end`
- `into`
- `peek`
- `poll`
- `size`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { Effect, Queue } from "effect"

// Function that only needs write access to a queue
const producer = (enqueue: Queue.Enqueue<string>) =>
  Effect.gen(function*() {
    yield* Queue.offer(enqueue as Queue.Queue<string>, "hello")
    yield* Queue.offerAll(enqueue as Queue.Queue<string>, ["world", "!"])
  })

const program = Effect.gen(function*() {
  const queue = yield* Queue.bounded<string>(10)
  yield* producer(queue)
})
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Queue.ts`
- Representative tests: `packages/effect/test/Queue.test.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/cluster/Sharding.test.ts`
- Representative tests: `packages/effect/test/Stream.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
