---
name: effect-module-cache
description: Guidance for `effect/Cache` focused on APIs like get, set, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Cache

## Owned scope

- Owns only `effect/Cache`.
- Source of truth: `packages/effect/src/Cache.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `set`
- `make`
- `makeWith`
- `getOption`
- `getSuccess`
- `has`
- `keys`
- `size`
- `Cache`
- `Entry`
- `values`
- `entries`
- `refresh`
- `invalidate`
- `invalidateAll`
- `invalidateWhen`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Cache.ts`
- Representative tests: `packages/effect/test/Cache.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
