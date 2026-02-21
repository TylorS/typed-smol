# Usage Reference: effect/Cache

- Import path: `effect/Cache`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Cache, Effect } from "effect"

// Basic cache with string keys and number values
const program = Effect.gen(function*() {
  const cache = yield* Cache.make<string, number>({
    capacity: 100,
    lookup: (key: string) => Effect.succeed(key.length)
  })

  // Cache operations
  const value1 = yield* Cache.get(cache, "hello") // 5
  const value2 = yield* Cache.get(cache, "world") // 5
  const value3 = yield* Cache.get(cache, "hello") // 5 (cached)

  return [value1, value2, value3]
})
```

## Test Anchors

- `packages/effect/test/Cache.test.ts`

## Top Symbols In Anchored Tests

- `Cache` (336)
- `get` (149)
- `make` (77)
- `has` (57)
- `entries` (24)
- `size` (23)
- `refresh` (18)
- `keys` (17)
- `set` (15)
- `values` (12)
- `invalidate` (9)
- `invalidateAll` (8)
- `makeWith` (8)
- `getOption` (7)
- `getSuccess` (5)
