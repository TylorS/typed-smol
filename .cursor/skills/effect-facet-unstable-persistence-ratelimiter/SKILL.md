---
name: effect-facet-unstable-persistence-ratelimiter
description: Guidance for facet `effect/unstable/persistence/RateLimiter` focused on APIs like make, layer, and makeSleep. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/persistence/RateLimiter

## Owned scope

- Owns only `effect/unstable/persistence/RateLimiter`.
- Parent module: `effect/unstable/persistence`.
- Source anchor: `packages/effect/src/unstable/persistence/RateLimiter.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `layer`
- `makeSleep`
- `layerStoreMemory`
- `layerStoreRedis`
- `layerStoreRedisConfig`
- `makeStoreRedis`
- `makeWithRateLimiter`
- `TypeId`
- `ErrorTypeId`
- `RateLimiter`
- `ConsumeResult`
- `RateLimiterError`
- `RateLimiterErrorReason`
- `RateLimiterStore`
- `RateLimitExceeded`
- `RateLimitStoreError`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-persistence-keyvaluestore` (effect/unstable/persistence/KeyValueStore)
  - `effect-facet-unstable-persistence-persistable` (effect/unstable/persistence/Persistable)
  - `effect-facet-unstable-persistence-persistedcache` (effect/unstable/persistence/PersistedCache)
  - `effect-facet-unstable-persistence-persistedqueue` (effect/unstable/persistence/PersistedQueue)
  - `effect-facet-unstable-persistence-persistence` (effect/unstable/persistence/Persistence)
  - `effect-facet-unstable-persistence-redis` (effect/unstable/persistence/Redis)
- Parent module ownership belongs to `effect-module-unstable-persistence`.

## Escalate to

- `effect-module-unstable-persistence` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/persistence/RateLimiter.ts`
- Parent tests: `packages/effect/test/unstable/persistence/RateLimiter.test.ts`
- Parent tests: `packages/effect/test/unstable/persistence/PersistedCache.test.ts`
- Parent tests: `packages/effect/test/unstable/persistence/PersistedQueue.test.ts`
- Parent tests: `packages/effect/test/reactivity/Atom.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- Parent tests: `packages/effect/test/unstable/persistence/KeyValueStore.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
