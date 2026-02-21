# Usage Reference: effect/Record

- Import path: `effect/Record`

## What It Is For

This module provides utility functions for working with records in TypeScript.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import type { Record } from "effect"

// Creating a readonly record type
type UserRecord = Record.ReadonlyRecord<"name" | "age", string | number>

const user: UserRecord = {
  name: "John",
  age: 30
}
```

## Test Anchors

- `packages/effect/test/Record.test.ts`
- `packages/effect/test/schema/toIso.test.ts`

## Top Symbols In Anchored Tests

- `modify` (106)
- `map` (13)
- `empty` (10)
- `isSubrecord` (10)
- `replace` (8)
- `ReadonlyRecord` (7)
- `some` (7)
- `difference` (6)
- `makeEquivalence` (6)
- `singleton` (6)
- `union` (6)
- `findFirst` (5)
- `get` (5)
- `has` (5)
- `pop` (5)
