# Usage Reference: effect/unstable/persistence/RateLimiter

- Import path: `effect/unstable/persistence/RateLimiter`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect"
import { RateLimiter } from "effect/unstable/persistence"

Effect.gen(function*() {
  // Access the `withLimiter` function from the RateLimiter module
  const withLimiter = yield* RateLimiter.makeWithRateLimiter

  // Apply a rate limiter to an effect
  yield* Effect.log("Making a request with rate limiting").pipe(
    withLimiter({
      key: "some-key",
      limit: 10,
      onExceeded: "delay",
      window: "5 seconds",
      algorithm: "fixed-window"
    })
  )
})
```

## Test Anchors

- `packages/effect/test/unstable/persistence/RateLimiter.test.ts`
- `packages/effect/test/unstable/persistence/PersistedCache.test.ts`
- `packages/effect/test/unstable/persistence/PersistedQueue.test.ts`
- `packages/effect/test/reactivity/Atom.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/persistence/KeyValueStore.test.ts`

## Top Symbols In Anchored Tests

- `make` (152)
- `RateLimiter` (10)
- `RateLimitExceeded` (6)
- `layerStoreMemory` (5)
- `layer` (3)
