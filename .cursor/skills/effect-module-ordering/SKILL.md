---
name: effect-module-ordering
description: Guidance for `effect/Ordering` focused on APIs like match, Reducer, and reverse. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Ordering

## Owned scope

- Owns only `effect/Ordering`.
- Source of truth: `packages/effect/src/Ordering.ts`.

## What it is for

- The Ordering module provides utilities for working with comparison results and ordering operations. An Ordering represents the result of comparing two values, expressing whether the first value is less than (-1), equal to (0), or greater than (1) the second value.

## API quick reference

- `match`
- `Reducer`
- `reverse`
- `Ordering`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { Ordering } from "effect"

// Custom comparison function
const compareNumbers = (a: number, b: number): Ordering.Ordering => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

console.log(compareNumbers(5, 10)) // -1 (5 < 10)
console.log(compareNumbers(10, 5)) // 1 (10 > 5)
console.log(compareNumbers(5, 5)) // 0 (5 == 5)

// Using with string comparison
const compareStrings = (a: string, b: string): Ordering.Ordering => {
  return a.localeCompare(b) as Ordering.Ordering
}
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Ordering.ts`
- Representative tests: `packages/effect/test/Ordering.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
