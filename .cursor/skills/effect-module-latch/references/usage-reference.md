# Usage Reference: effect/Latch

- Import path: `effect/Latch`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/Layer.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/PubSub.test.ts`
- `packages/effect/test/reactivity/Atom.test.ts`
- `packages/effect/test/Stream.test.ts`

## Top Symbols In Anchored Tests

- `make` (445)
- `Latch` (25)
- `makeUnsafe` (8)
