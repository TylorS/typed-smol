# Usage Reference: effect/Combiner

- Import path: `effect/Combiner`

## What It Is For

A module for combining two values of the same type into one.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Combiner, String } from "effect"

const csv = Combiner.intercalate(",")(String.ReducerConcat)

console.log(csv.combine("a", "b"))
// Output: "a,b"

console.log(csv.combine(csv.combine("a", "b"), "c"))
// Output: "a,b,c"
```

## Test Anchors

- `packages/effect/test/Combiner.test.ts`

## Top Symbols In Anchored Tests

- `Combiner` (9)
- `constant` (2)
- `first` (2)
- `flip` (2)
- `intercalate` (2)
- `last` (2)
- `max` (2)
- `min` (2)
