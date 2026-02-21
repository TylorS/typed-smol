# Usage Reference: effect/FiberMap

- Import path: `effect/FiberMap`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, FiberMap } from "effect";

// Create a FiberMap with string keys
const program = Effect.gen(function* () {
  const map = yield* FiberMap.make<string>();

  // Add some fibers to the map
  yield* FiberMap.run(map, "task1", Effect.succeed("Hello"));
  yield* FiberMap.run(map, "task2", Effect.succeed("World"));

  // Get the size of the map
  const size = yield* FiberMap.size(map);
  console.log(size); // 2
});
```

## Test Anchors

- `packages/effect/test/FiberMap.test.ts`

## Top Symbols In Anchored Tests

- `FiberMap` (34)
- `run` (18)
- `make` (11)
- `setUnsafe` (6)
- `set` (5)
- `join` (3)
- `runtime` (3)
- `size` (3)
- `awaitEmpty` (2)
- `get` (2)
- `makeRuntimePromise` (2)
- `makeRuntime` (1)
