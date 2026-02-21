---
name: effect-module-fibermap
description: Guidance for `effect/FiberMap` focused on APIs like get, run, and set. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module FiberMap

## Owned scope

- Owns only `effect/FiberMap`.
- Source of truth: `packages/effect/src/FiberMap.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `run`
- `set`
- `make`
- `runtime`
- `makeRuntime`
- `makeRuntimePromise`
- `runtimePromise`
- `getUnsafe`
- `setUnsafe`
- `isFiberMap`
- `has`
- `join`
- `size`
- `clear`
- `remove`
- `FiberMap`
- `awaitEmpty`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Starter example

```ts
import { Effect, FiberMap } from "effect"

// Create a FiberMap with string keys
const program = Effect.gen(function*() {
  const map = yield* FiberMap.make<string>()

  // Add some fibers to the map
  yield* FiberMap.run(map, "task1", Effect.succeed("Hello"))
  yield* FiberMap.run(map, "task2", Effect.succeed("World"))

  // Get the size of the map
  const size = yield* FiberMap.size(map)
  console.log(size) // 2
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

- Module source: `packages/effect/src/FiberMap.ts`
- Representative tests: `packages/effect/test/FiberMap.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
