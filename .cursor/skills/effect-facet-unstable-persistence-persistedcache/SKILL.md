---
name: effect-facet-unstable-persistence-persistedcache
description: Guidance for facet `effect/unstable/persistence/PersistedCache` focused on APIs like make and PersistedCache. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/persistence/PersistedCache

## Owned scope

- Owns only `effect/unstable/persistence/PersistedCache`.
- Parent module: `effect/unstable/persistence`.
- Source anchor: `packages/effect/src/unstable/persistence/PersistedCache.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `PersistedCache`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { PersistedCache } from "effect/unstable/persistence/PersistedCache";

const value = PersistedCache.make();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-persistence-keyvaluestore` (effect/unstable/persistence/KeyValueStore)
  - `effect-facet-unstable-persistence-persistable` (effect/unstable/persistence/Persistable)
  - `effect-facet-unstable-persistence-persistedqueue` (effect/unstable/persistence/PersistedQueue)
  - `effect-facet-unstable-persistence-persistence` (effect/unstable/persistence/Persistence)
  - `effect-facet-unstable-persistence-ratelimiter` (effect/unstable/persistence/RateLimiter)
  - `effect-facet-unstable-persistence-redis` (effect/unstable/persistence/Redis)
- Parent module ownership belongs to `effect-module-unstable-persistence`.

## Escalate to

- `effect-module-unstable-persistence` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/persistence/PersistedCache.ts`
- Parent tests: `packages/effect/test/unstable/persistence/PersistedCache.test.ts`
- Parent tests: `packages/effect/test/unstable/persistence/PersistedQueue.test.ts`
- Parent tests: `packages/effect/test/unstable/persistence/RateLimiter.test.ts`
- Parent tests: `packages/effect/test/reactivity/Atom.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- Parent tests: `packages/effect/test/unstable/persistence/KeyValueStore.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
