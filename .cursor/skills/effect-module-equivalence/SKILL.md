---
name: effect-module-equivalence
description: Guidance for `effect/Equivalence` focused on APIs like make, mapInput, and makeReducer. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Equivalence

## Owned scope

- Owns only `effect/Equivalence`.
- Source of truth: `packages/effect/src/Equivalence.ts`.

## What it is for

- Utilities for defining equivalence relations - binary relations that determine when two values should be considered equivalent. Equivalence relations are used for comparing, deduplicating, and organizing data in collections and data structures.

## API quick reference

- `make`
- `mapInput`
- `makeReducer`
- `Array`
- `Tuple`
- `BigInt`
- `Number`
- `Record`
- `String`
- `Struct`
- `Boolean`
- `combine`
- `combineAll`
- `Equivalence`
- `strictEqual`
- `EquivalenceTypeLambda`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Array, Equivalence } from "effect"

const caseInsensitive = Equivalence.make<string>((a, b) =>
  a.toLowerCase() === b.toLowerCase()
)

const strings = ["Hello", "world", "HELLO", "World"]
const deduplicated = Array.dedupeWith(strings, caseInsensitive)
console.log(deduplicated) // ["Hello", "world"]
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Equivalence.ts`
- Representative tests: `packages/effect/test/Equivalence.test.ts`
- Representative tests: `packages/effect/test/Array.test.ts`
- Representative tests: `packages/effect/test/Chunk.test.ts`
- Representative tests: `packages/effect/test/Iterable.test.ts`
- Representative tests: `packages/effect/test/Option.test.ts`
- Representative tests: `packages/effect/test/Record.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
