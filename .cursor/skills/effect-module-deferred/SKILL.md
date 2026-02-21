---
name: effect-module-deferred
description: Guidance for `effect/Deferred` focused on APIs like fail, make, and succeed. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Deferred

## Owned scope

- Owns only `effect/Deferred`.
- Source of truth: `packages/effect/src/Deferred.ts`.

## What it is for

- This module provides utilities for working with `Deferred`, a powerful concurrency primitive that represents an asynchronous variable that can be set exactly once. Multiple fibers can await the same `Deferred` and will all be notified when it completes.

## API quick reference

- `fail`
- `make`
- `succeed`
- `failSync`
- `failCause`
- `failCauseSync`
- `makeUnsafe`
- `isDone`
- `die`
- `done`
- `into`
- `poll`
- `sync`
- `Effect`
- `dieSync`
- `complete`
- `Deferred`
- `Variance`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Deferred.ts`
- Representative tests: `packages/effect/test/Deferred.test.ts`
- Representative tests: `packages/effect/test/Cache.test.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- Representative tests: `packages/effect/test/FiberHandle.test.ts`
- Representative tests: `packages/effect/test/FiberMap.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
