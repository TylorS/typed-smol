# Usage Reference: effect/Optic

- Import path: `effect/Optic`

## What It Is For

Design: "pretty good" persistency. Real updates copy only the path; unrelated branches keep referential identity. No-op updates may still allocate a new root/parents — callers must not rely on identity for no-ops.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Optic } from "effect/Optic";

const value = Optic.makeIso();
const next = Optic.getAll(value);
```

## Test Anchors

- `packages/effect/test/Optic.test.ts`

## Top Symbols In Anchored Tests

- `id` (42)
- `entries` (6)
- `getAll` (5)
- `none` (5)
- `some` (5)
- `failure` (3)
- `success` (3)
- `fromChecks` (2)
