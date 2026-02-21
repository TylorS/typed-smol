# Usage Reference: effect/Queue

- Import path: `effect/Queue`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Queue.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`
- `packages/effect/test/Stream.test.ts`

## Top Symbols In Anchored Tests

- `make` (294)
- `Queue` (176)
- `fail` (145)
- `take` (60)
- `offer` (49)
- `await` (45)
- `interrupt` (30)
- `size` (30)
- `sliding` (24)
- `offerAll` (21)
- `bounded` (17)
- `end` (15)
- `unbounded` (14)
- `takeAll` (13)
- `dropping` (10)
