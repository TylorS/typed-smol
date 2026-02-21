# Usage Reference: effect/unstable/persistence

- Import path: `effect/unstable/persistence`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { persistence } from "effect/unstable/persistence";

const value = persistence.Redis();
```

## Test Anchors

- `packages/effect/test/unstable/persistence/PersistedCache.test.ts`
- `packages/effect/test/unstable/persistence/PersistedQueue.test.ts`
- `packages/effect/test/unstable/persistence/RateLimiter.test.ts`
- `packages/effect/test/reactivity/Atom.test.ts`
- `packages/effect/test/unstable/ai/Chat.test.ts`
- `packages/effect/test/unstable/persistence/KeyValueStore.test.ts`

## Top Symbols In Anchored Tests

- `KeyValueStore` (53)
- `Persistence` (14)
- `RateLimiter` (10)
- `PersistedQueue` (2)
