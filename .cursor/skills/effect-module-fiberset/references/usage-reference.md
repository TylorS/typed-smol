# Usage Reference: effect/FiberSet

- Import path: `effect/FiberSet`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, FiberSet } from "effect";

const program = Effect.gen(function* () {
  const set = yield* FiberSet.make<string, string>();

  // Add fibers to the set
  yield* FiberSet.run(set, Effect.succeed("hello"));
  yield* FiberSet.run(set, Effect.succeed("world"));

  // Wait for all fibers to complete
  yield* FiberSet.awaitEmpty(set);
});
```

## Test Anchors

- `packages/effect/test/FiberSet.test.ts`

## Top Symbols In Anchored Tests

- `FiberSet` (28)
- `run` (11)
- `make` (10)
- `addUnsafe` (5)
- `join` (3)
- `size` (3)
- `awaitEmpty` (2)
- `makeRuntimePromise` (2)
- `runtime` (2)
