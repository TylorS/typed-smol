# Usage Reference: effect/Filter

- Import path: `effect/Filter`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Filter, Result } from "effect";

// A filter that only passes positive numbers
const positiveFilter: Filter.Filter<number> = (n) => (n > 0 ? Result.succeed(n) : Result.fail(n));

console.log(positiveFilter(5)); // Result.succeed(5)
console.log(positiveFilter(-3)); // Result.fail(-3)
```

## Test Anchors

- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/Effect.test.ts`

## Top Symbols In Anchored Tests

- `number` (121)
- `make` (73)
- `string` (56)
- `reason` (48)
- `Filter` (16)
- `boolean` (9)
- `zip` (8)
- `zipWith` (8)
- `compose` (1)
- `FilterEffect` (1)
- `makeEffect` (1)
