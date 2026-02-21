---
name: effect-facet-unstable-persistence-keyvaluestore
description: Guidance for facet `effect/unstable/persistence/KeyValueStore` focused on APIs like make, layerMemory, and MakeOptions. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/persistence/KeyValueStore

## Owned scope

- Owns only `effect/unstable/persistence/KeyValueStore`.
- Parent module: `effect/unstable/persistence`.
- Source anchor: `packages/effect/src/unstable/persistence/KeyValueStore.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `layerMemory`
- `MakeOptions`
- `layerStorage`
- `layerFileSystem`
- `makeStringOnly`
- `MakeStringOptions`
- `prefix`
- `SchemaStore`
- `KeyValueStore`
- `toSchemaStore`
- `KeyValueStoreError`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { KeyValueStore } from "effect/unstable/persistence/KeyValueStore"

const value = KeyValueStore.make()
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-persistence-persistable` (effect/unstable/persistence/Persistable)
  - `effect-facet-unstable-persistence-persistedcache` (effect/unstable/persistence/PersistedCache)
  - `effect-facet-unstable-persistence-persistedqueue` (effect/unstable/persistence/PersistedQueue)
  - `effect-facet-unstable-persistence-persistence` (effect/unstable/persistence/Persistence)
  - `effect-facet-unstable-persistence-ratelimiter` (effect/unstable/persistence/RateLimiter)
  - `effect-facet-unstable-persistence-redis` (effect/unstable/persistence/Redis)
- Parent module ownership belongs to `effect-module-unstable-persistence`.

## Escalate to

- `effect-module-unstable-persistence` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/persistence/KeyValueStore.ts`
- Parent tests: `packages/effect/test/unstable/persistence/KeyValueStore.test.ts`
- Parent tests: `packages/effect/test/unstable/persistence/PersistedCache.test.ts`
- Parent tests: `packages/effect/test/unstable/persistence/PersistedQueue.test.ts`
- Parent tests: `packages/effect/test/unstable/persistence/RateLimiter.test.ts`
- Parent tests: `packages/effect/test/reactivity/Atom.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Chat.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
