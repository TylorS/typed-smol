# Usage Reference: effect/Struct

- Import path: `effect/Struct`

## What It Is For

Utilities for creating, transforming, and comparing plain TypeScript objects (structs). Every function produces a new object — inputs are never mutated.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { pipe, Struct } from "effect";

const user = { firstName: "Alice", lastName: "Smith", age: 30, admin: false };

const result = pipe(
  user,
  Struct.pick(["firstName", "age"]),
  Struct.evolve({ age: (n) => n + 1 }),
  Struct.renameKeys({ firstName: "name" }),
);

console.log(result); // { name: "Alice", age: 31 }
```

## Test Anchors

- `packages/effect/test/Struct.test.ts`
- `packages/effect/test/HttpClient.test.ts`
- `packages/effect/test/schema/Schema.test.ts`

## Top Symbols In Anchored Tests

- `Record` (52)
- `map` (19)
- `omit` (19)
- `keys` (18)
- `evolve` (14)
- `get` (11)
- `pick` (11)
- `mapPick` (6)
- `evolveEntries` (5)
- `evolveKeys` (5)
- `makeReducer` (5)
- `mapOmit` (5)
- `renameKeys` (5)
- `assign` (4)
- `makeCombiner` (3)
