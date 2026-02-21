---
name: effect-module-scopedcache
description: Guidance for `effect/ScopedCache` focused on APIs like get, set, and make. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module ScopedCache

## Owned scope

- Owns only `effect/ScopedCache`.
- Source of truth: `packages/effect/src/ScopedCache.ts`.

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
- `Entry`
- `State`
- `values`
- `entries`
- `refresh`
- `invalidate`
- `ScopedCache`
- `invalidateAll`
- `invalidateWhen`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { ScopedCache } from "effect/ScopedCache"

const value = ScopedCache.make()
const next = ScopedCache.get(value)
```

## Common pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/ScopedCache.ts`
- Representative tests: `packages/effect/test/ScopedCache.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
