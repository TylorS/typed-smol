---
name: effect-module-pool
description: Guidance for `effect/Pool` focused on APIs like get, make, and makeWithTTL. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Pool

## Owned scope

- Owns only `effect/Pool`.
- Source of truth: `packages/effect/src/Pool.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `make`
- `makeWithTTL`
- `makeWithStrategy`
- `isPool`
- `Pool`
- `State`
- `Config`
- `PoolItem`
- `Strategy`
- `invalidate`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Pool } from "effect/Pool"

const value = Pool.make()
const next = Pool.get(value)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Pool.ts`
- Representative tests: `packages/effect/test/Pool.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
