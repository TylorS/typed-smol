# Usage Reference: effect/FiberHandle

- Import path: `effect/FiberHandle`

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
import { Effect, Fiber, FiberHandle } from "effect"

Effect.gen(function*() {
  // Create a FiberHandle that can hold fibers producing strings
  const handle = yield* FiberHandle.make<string, never>()

  // The handle can store and manage a single fiber
  const fiber = yield* FiberHandle.run(handle, Effect.succeed("hello"))
  const result = yield* Fiber.await(fiber)
  console.log(result) // "hello"
})
```

## Test Anchors

- `packages/effect/test/FiberHandle.test.ts`

## Top Symbols In Anchored Tests

- `FiberHandle` (24)
- `run` (17)
- `make` (9)
- `get` (3)
- `join` (3)
- `runtime` (3)
- `awaitEmpty` (2)
- `makeRuntimePromise` (2)
- `setUnsafe` (2)
- `makeRuntime` (1)
