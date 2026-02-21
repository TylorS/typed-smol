---
name: effect-facet-fiber-status
description: Guidance for facet `effect/Fiber#status` focused on APIs like isFiber. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Fiber#status

## Owned scope

- Owns only `effect/Fiber#status`.
- Parent module: `effect/Fiber`.

## What it is for

- fiber status and introspection APIs. This module provides utilities for working with `Fiber`, the fundamental unit of concurrency in Effect. Fibers are lightweight, user-space threads that allow multiple Effects to run concurrently with structured concurrency guarantees.

## API quick reference

- `isFiber`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `status` concern for `effect/Fiber`.
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

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-fiber-collections` (effect/Fiber#collections)
  - `effect-facet-fiber-lifecycle` (effect/Fiber#lifecycle)
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
