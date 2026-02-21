# Usage Reference: effect/Fiber

- Import path: `effect/Fiber`

## What It Is For

This module provides utilities for working with `Fiber`, the fundamental unit of concurrency in Effect. Fibers are lightweight, user-space threads that allow multiple Effects to run concurrently with structured concurrency guarantees.

## How To Use

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Console, Effect, Fiber } from "effect"

// Basic fiber operations
const basicExample = Effect.gen(function*() {
  // Fork an effect to run concurrently
  const fiber = yield* Effect.forkChild(
    Effect.gen(function*() {
      yield* Effect.sleep("2 seconds")
      yield* Console.log("Background task completed")
      return "background result"
    })
  )

  // Do other work while the fiber runs
  yield* Console.log("Doing other work...")
  yield* Effect.sleep("1 second")

  // Wait for the fiber to complete
  const result = yield* Fiber.join(fiber)
  yield* Console.log(`Fiber result: ${result}`)
})

// Joining multiple fibers
const joinExample = Effect.gen(function*() {
```

## Test Anchors

- `packages/effect/test/Fiber.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/Cache.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- `Fiber` (34)
- `interrupt` (20)
- `join` (14)
- `interruptAll` (1)
- `isFiber` (1)
