# Usage Reference: effect/Pool

- Import path: `effect/Pool`

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
import { Pool } from "effect/Pool"

const value = Pool.make()
const next = Pool.get(value)
```

## Test Anchors

- `packages/effect/test/Pool.test.ts`

## Top Symbols In Anchored Tests

- `get` (96)
- `Pool` (55)
- `make` (46)
- `makeWithTTL` (7)
- `invalidate` (5)
