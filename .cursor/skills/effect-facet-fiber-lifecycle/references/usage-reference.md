# Usage Reference: effect/Fiber#lifecycle

- Import path: `effect/Fiber#lifecycle`

## What It Is For

join/interrupt/await lifecycle controls. This module provides utilities for working with `Fiber`, the fundamental unit of concurrency in Effect. Fibers are lightweight, user-space threads that allow multiple Effects to run concurrently with structured concurrency guarantees.

## How To Use

- Keep work focused on the `lifecycle` concern for `effect/Fiber`.
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

## Top Symbols In Anchored Tests

- `join` (2)
- `interrupt` (1)
