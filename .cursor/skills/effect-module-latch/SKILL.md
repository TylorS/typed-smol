---
name: effect-module-latch
description: Guidance for `effect/Latch` focused on APIs like make, makeUnsafe, and Latch. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Latch

## Owned scope

- Owns only `effect/Latch`.
- Source of truth: `packages/effect/src/Latch.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `makeUnsafe`
- `Latch`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, Latch } from "effect"

// Create and use a latch for coordination between fibers
const program = Effect.gen(function*() {
  const latch = yield* Latch.make()

  // Wait for the latch to be opened
  yield* latch.await

  return "Latch was opened!"
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

- Module source: `packages/effect/src/Latch.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/Layer.test.ts`
- Representative tests: `packages/effect/test/cluster/MessageStorage.test.ts`
- Representative tests: `packages/effect/test/PubSub.test.ts`
- Representative tests: `packages/effect/test/reactivity/Atom.test.ts`
- Representative tests: `packages/effect/test/Stream.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
