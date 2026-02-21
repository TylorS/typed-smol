---
name: effect-module-nonemptyiterable
description: Guidance for `effect/NonEmptyIterable` focused on APIs like nonEmpty, unprepend, and NonEmptyIterable. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module NonEmptyIterable

## Owned scope

- Owns only `effect/NonEmptyIterable`.
- Source of truth: `packages/effect/src/NonEmptyIterable.ts`.

## What it is for

- The `NonEmptyIterable` module provides types and utilities for working with iterables that are guaranteed to contain at least one element. This provides compile-time safety when working with collections that must not be empty.

## API quick reference

- `nonEmpty`
- `unprepend`
- `NonEmptyIterable`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/NonEmptyIterable.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
