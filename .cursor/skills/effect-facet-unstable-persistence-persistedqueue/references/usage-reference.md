# Usage Reference: effect/unstable/persistence/PersistedQueue

- Import path: `effect/unstable/persistence/PersistedQueue`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { PersistedQueue } from "effect/unstable/persistence/PersistedQueue";

const value = PersistedQueue.make();
```

## Test Anchors

- `packages/effect/test/unstable/persistence/PersistedQueue.test.ts`
- `packages/effect/test/unstable/persistence/PersistedCache.test.ts`
- `packages/effect/test/unstable/persistence/RateLimiter.test.ts`
- `packages/effect/test/reactivity/Atom.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/persistence/KeyValueStore.test.ts`

## Top Symbols In Anchored Tests

- `make` (152)
- `layerStoreMemory` (5)
- `layer` (3)
- `PersistedQueue` (2)
