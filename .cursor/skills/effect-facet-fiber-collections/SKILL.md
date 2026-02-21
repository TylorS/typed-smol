---
name: effect-facet-fiber-collections
description: Guidance for facet `effect/Fiber#collections` focused on APIs like runIn, getCurrent, and isFiber. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Fiber#collections

## Owned scope

- Owns only `effect/Fiber#collections`.
- Parent module: `effect/Fiber`.

## What it is for

- FiberMap/FiberSet/FiberHandle patterns. This module provides utilities for working with `Fiber`, the fundamental unit of concurrency in Effect. Fibers are lightweight, user-space threads that allow multiple Effects to run concurrently with structured concurrency guarantees.

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

- Keep work focused on the `collections` concern for `effect/Fiber`.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

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

- Sibling facets under the same parent are out of scope:
  - `effect-facet-fiber-lifecycle` (effect/Fiber#lifecycle)
  - `effect-facet-fiber-status` (effect/Fiber#status)
- Parent module ownership belongs to `effect-module-fiber`.

## Escalate to

- `effect-module-fiber` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Fiber.test.ts`
- Parent tests: `packages/effect/test/Channel.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
