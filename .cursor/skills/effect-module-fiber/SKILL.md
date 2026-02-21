---
name: effect-module-fiber
description: Guidance for `effect/Fiber` focused on APIs like runIn, getCurrent, and isFiber. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Fiber

## Owned scope

- Owns only `effect/Fiber`.
- Source of truth: `packages/effect/src/Fiber.ts`.

## What it is for

- This module provides utilities for working with `Fiber`, the fundamental unit of concurrency in Effect. Fibers are lightweight, user-space threads that allow multiple Effects to run concurrently with structured concurrency guarantees.

## API quick reference

- `runIn`
- `getCurrent`
- `isFiber`
- `join`
- `Fiber`
- `joinAll`
- `awaitAll`
- `Variance`
- `interrupt`
- `interruptAs`
- `interruptAll`
- `interruptAllAs`
- Full API list: `references/api-reference.md`

## How to use it

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-fiber-collections` (effect/Fiber#collections)
  - `effect-facet-fiber-lifecycle` (effect/Fiber#lifecycle)
  - `effect-facet-fiber-status` (effect/Fiber#status)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-fiber-collections`.

## Reference anchors

- Module source: `packages/effect/src/Fiber.ts`
- Representative tests: `packages/effect/test/Fiber.test.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/Cache.test.ts`
- Representative tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- Representative tests: `packages/effect/test/cluster/MessageStorage.test.ts`
- Representative tests: `packages/effect/test/cluster/Sharding.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
