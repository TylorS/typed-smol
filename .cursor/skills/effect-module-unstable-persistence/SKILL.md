---
name: effect-module-unstable-persistence
description: Guidance for `effect/unstable/persistence` focused on APIs like Redis, Persistable, and Persistence. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/persistence

## Owned scope

- Owns only `effect/unstable/persistence`.
- Source of truth: `packages/effect/src/unstable/persistence/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Redis`
- `Persistable`
- `Persistence`
- `RateLimiter`
- `KeyValueStore`
- `PersistedCache`
- `PersistedQueue`
- Full API list: `references/api-reference.md`

## How to use it

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { persistence } from "effect/unstable/persistence";

const value = persistence.Redis();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-persistence-keyvaluestore` (effect/unstable/persistence/KeyValueStore)
  - `effect-facet-unstable-persistence-persistable` (effect/unstable/persistence/Persistable)
  - `effect-facet-unstable-persistence-persistedcache` (effect/unstable/persistence/PersistedCache)
  - `effect-facet-unstable-persistence-persistedqueue` (effect/unstable/persistence/PersistedQueue)
  - `effect-facet-unstable-persistence-persistence` (effect/unstable/persistence/Persistence)
  - `effect-facet-unstable-persistence-ratelimiter` (effect/unstable/persistence/RateLimiter)
  - `effect-facet-unstable-persistence-redis` (effect/unstable/persistence/Redis)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-persistence-keyvaluestore`.

## Reference anchors

- Module source: `packages/effect/src/unstable/persistence/index.ts`
- Representative tests: `packages/effect/test/unstable/persistence/PersistedCache.test.ts`
- Representative tests: `packages/effect/test/unstable/persistence/PersistedQueue.test.ts`
- Representative tests: `packages/effect/test/unstable/persistence/RateLimiter.test.ts`
- Representative tests: `packages/effect/test/reactivity/Atom.test.ts`
- Representative tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- Representative tests: `packages/effect/test/unstable/persistence/KeyValueStore.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
