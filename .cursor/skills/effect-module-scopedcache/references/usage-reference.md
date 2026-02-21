# Usage Reference: effect/ScopedCache

- Import path: `effect/ScopedCache`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { ScopedCache } from "effect/ScopedCache"

const value = ScopedCache.make()
const next = ScopedCache.get(value)
```

## Test Anchors

- `packages/effect/test/ScopedCache.test.ts`

## Top Symbols In Anchored Tests

- `ScopedCache` (474)
- `get` (210)
- `make` (94)
- `has` (83)
- `entries` (37)
- `refresh` (30)
- `size` (26)
- `keys` (21)
- `invalidate` (18)
- `set` (18)
- `values` (18)
- `makeWith` (14)
- `invalidateAll` (9)
- `getOption` (8)
- `invalidateWhen` (6)
