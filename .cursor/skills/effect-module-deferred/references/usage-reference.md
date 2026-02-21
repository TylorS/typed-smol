# Usage Reference: effect/Deferred

- Import path: `effect/Deferred`

## What It Is For

This module provides utilities for working with `Deferred`, a powerful concurrency primitive that represents an asynchronous variable that can be set exactly once. Multiple fibers can await the same `Deferred` and will all be notified when it completes.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Starter Example

```ts
import { Deferred, Effect, Fiber } from "effect"

// Basic usage: coordinate between fibers
const program = Effect.gen(function*() {
  const deferred = yield* Deferred.make<string, never>()

  // Fiber 1: waits for the value
  const waiter = yield* Effect.forkChild(
    Effect.gen(function*() {
      const value = yield* Deferred.await(deferred)
      console.log("Received:", value)
      return value
    })
  )

  // Fiber 2: sets the value after a delay
  const setter = yield* Effect.forkChild(
    Effect.gen(function*() {
      yield* Effect.sleep("1 second")
      yield* Deferred.succeed(deferred, "Hello from setter!")
    })
  )

  // Wait for both fibers
```

## Test Anchors

- `packages/effect/test/Deferred.test.ts`
- `packages/effect/test/Cache.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/FiberHandle.test.ts`
- `packages/effect/test/FiberMap.test.ts`

## Top Symbols In Anchored Tests

- `Effect` (1304)
- `succeed` (199)
- `fail` (181)
- `make` (147)
- `sync` (106)
- `Deferred` (80)
- `interrupt` (37)
- `done` (19)
- `complete` (13)
- `die` (13)
- `failSync` (12)
- `poll` (8)
- `completeWith` (6)
- `failCause` (6)
- `isDone` (6)
