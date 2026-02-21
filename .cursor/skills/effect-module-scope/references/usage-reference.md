# Usage Reference: effect/Scope

- Import path: `effect/Scope`

## What It Is For

The `Scope` module provides functionality for managing resource lifecycles and cleanup operations in a functional and composable manner.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Starter Example

```ts
import { Effect, Exit, Scope } from "effect"

const program = Effect.gen(function*() {
  const scope = yield* Scope.make("sequential")

  // Scope has a strategy and state
  console.log(scope.strategy) // "sequential"
  console.log(scope.state._tag) // "Open"

  // Close the scope
  yield* Scope.close(scope, Exit.void)
  console.log(scope.state._tag) // "Closed"
})
```

## Test Anchors

- `packages/effect/test/Scope.test.ts`
- `packages/effect/test/Layer.test.ts`
- `packages/effect/test/RcRef.test.ts`
- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/FiberMap.test.ts`
- `packages/effect/test/FiberSet.test.ts`

## Top Symbols In Anchored Tests

- `make` (52)
- `Scope` (44)
- `provide` (32)
- `close` (12)
- `use` (7)
- `addFinalizer` (3)
- `makeUnsafe` (2)
- `fork` (1)
