---
name: effect-module-struct
description: Guidance for `effect/Struct` focused on APIs like get, map, and mapOmit. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Struct

## Owned scope

- Owns only `effect/Struct`.
- Source of truth: `packages/effect/src/Struct.ts`.

## What it is for

- Utilities for creating, transforming, and comparing plain TypeScript objects (structs). Every function produces a new object — inputs are never mutated.

## API quick reference

- `get`
- `map`
- `mapOmit`
- `mapPick`
- `makeOrder`
- `makeReducer`
- `makeCombiner`
- `makeEquivalence`
- `keys`
- `omit`
- `pick`
- `Apply`
- `assign`
- `Assign`
- `evolve`
- `lambda`
- `Lambda`
- `Record`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { pipe, Struct } from "effect"

const user = { firstName: "Alice", lastName: "Smith", age: 30, admin: false }

const result = pipe(
  user,
  Struct.pick(["firstName", "age"]),
  Struct.evolve({ age: (n) => n + 1 }),
  Struct.renameKeys({ firstName: "name" })
)

console.log(result) // { name: "Alice", age: 31 }
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Struct.ts`
- Representative tests: `packages/effect/test/Struct.test.ts`
- Representative tests: `packages/effect/test/HttpClient.test.ts`
- Representative tests: `packages/effect/test/schema/Schema.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
