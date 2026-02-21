# Usage Reference: effect/Scope#finalization

- Import path: `effect/Scope#finalization`

## What It Is For

finalizer registration and close behavior. The `Scope` module provides functionality for managing resource lifecycles and cleanup operations in a functional and composable manner.

## How To Use

- Keep work focused on the `finalization` concern for `effect/Scope`.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Exit, Scope } from "effect";

const program = Effect.gen(function* () {
  const scope = yield* Scope.make("sequential");

  // Scope has a strategy and state
  console.log(scope.strategy); // "sequential"
  console.log(scope.state._tag); // "Open"

  // Close the scope
  yield* Scope.close(scope, Exit.void);
  console.log(scope.state._tag); // "Closed"
});
```

## Test Anchors

- `packages/effect/test/Scope.test.ts`
- `packages/effect/test/Layer.test.ts`
- `packages/effect/test/RcRef.test.ts`

## Top Symbols In Anchored Tests

- `close` (8)
- `addFinalizer` (3)
