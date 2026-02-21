# Usage Reference: effect/unstable/persistence/KeyValueStore

- Import path: `effect/unstable/persistence/KeyValueStore`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { KeyValueStore } from "effect/unstable/persistence/KeyValueStore"

const value = KeyValueStore.make()
```

## Test Anchors

- `packages/effect/test/unstable/persistence/KeyValueStore.test.ts`
- `packages/effect/test/unstable/persistence/PersistedCache.test.ts`
- `packages/effect/test/unstable/persistence/PersistedQueue.test.ts`
- `packages/effect/test/unstable/persistence/RateLimiter.test.ts`
- `packages/effect/test/reactivity/Atom.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`

## Top Symbols In Anchored Tests

- `make` (152)
- `KeyValueStore` (53)
- `layerMemory` (8)
- `prefix` (8)
- `toSchemaStore` (4)
- `makeStringOnly` (3)
