# Usage Reference: effect/NonEmptyIterable

- Import path: `effect/NonEmptyIterable`

## What It Is For

The `NonEmptyIterable` module provides types and utilities for working with iterables that are guaranteed to contain at least one element. This provides compile-time safety when working with collections that must not be empty.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as NonEmptyIterable from "effect/NonEmptyIterable"

// NonEmptyIterable is a type that represents any iterable with at least one element
function processNonEmpty<A>(data: NonEmptyIterable.NonEmptyIterable<A>): A {
  // Safe to get the first element - guaranteed to exist
  const [first] = NonEmptyIterable.unprepend(data)
  return first
}

// Using Array.make to create non-empty arrays
const numbers = Array.make(
  1,
  2,
  3,
  4,
  5
) as unknown as NonEmptyIterable.NonEmptyIterable<number>
const firstNumber = processNonEmpty(numbers) // number

// Regular arrays can be asserted as NonEmptyIterable when known to be non-empty
const values = [1, 2, 3] as unknown as NonEmptyIterable.NonEmptyIterable<number>
const firstValue = processNonEmpty(values) // number

// Custom iterables that are guaranteed non-empty
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
