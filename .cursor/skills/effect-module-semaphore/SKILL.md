---
name: effect-module-semaphore
description: Guidance for `effect/Semaphore` focused on APIs like make, makePartitioned, and makeUnsafe. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Semaphore

## Owned scope

- Owns only `effect/Semaphore`.
- Source of truth: `packages/effect/src/Semaphore.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `makePartitioned`
- `makeUnsafe`
- `makePartitionedUnsafe`
- `Semaphore`
- `Partitioned`
- `PartitionedTypeId`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Effect, Semaphore } from "effect"

// Create and use a semaphore for controlling concurrent access
const program = Effect.gen(function*() {
  const semaphore = yield* Semaphore.make(2)

  return yield* semaphore.withPermits(1)(
    Effect.succeed("Resource accessed")
  )
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

- Module source: `packages/effect/src/Semaphore.ts`
- Representative tests: `packages/effect/test/Semaphore.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
