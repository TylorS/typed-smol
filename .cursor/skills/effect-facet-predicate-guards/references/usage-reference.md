# Usage Reference: effect/Predicate#guards

- Import path: `effect/Predicate#guards`

## What It Is For

runtime type guard helpers. Predicate and Refinement helpers for runtime checks, filtering, and type narrowing. This module provides small, pure functions you can combine to decide whether a value matches a condition and, when using refinements, narrow TypeScript types.

## How To Use

- Keep work focused on the `guards` concern for `effect/Predicate`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as Predicate from "effect/Predicate"

const isPositive = (n: number) => n > 0
const data = [2, -1, 3]

console.log(data.filter(isPositive))
```

## Test Anchors

- `packages/effect/test/Predicate.test.ts`
- `packages/effect/test/Iterable.test.ts`

## Top Symbols In Anchored Tests

- `Predicate` (193)
- `hasProperty` (13)
- `isObjectKeyword` (11)
- `isObject` (9)
- `isTruthy` (9)
- `isTagged` (8)
- `isIterable` (7)
- `isReadonlyObject` (7)
- `isString` (7)
- `isPropertyKey` (6)
- `isSet` (6)
- `isMap` (5)
- `isNever` (5)
- `isNotNullish` (5)
- `isNullish` (5)
