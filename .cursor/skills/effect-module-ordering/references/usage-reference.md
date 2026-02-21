# Usage Reference: effect/Ordering

- Import path: `effect/Ordering`

## What It Is For

The Ordering module provides utilities for working with comparison results and ordering operations. An Ordering represents the result of comparing two values, expressing whether the first value is less than (-1), equal to (0), or greater than (1) the second value.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Ordering.test.ts`

## Top Symbols In Anchored Tests

- `Ordering` (3)
- `Reducer` (2)
