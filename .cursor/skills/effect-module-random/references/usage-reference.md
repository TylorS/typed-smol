# Usage Reference: effect/Random

- Import path: `effect/Random`

## What It Is For

The Random module provides a service for generating random numbers in Effect programs. It offers a testable and composable way to work with randomness, supporting integers, floating-point numbers, and range-based generation.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Random } from "effect";

const program = Effect.gen(function* () {
  const randomFloat = yield* Random.next;
  console.log("Random float:", randomFloat);

  const randomInt = yield* Random.nextInt;
  console.log("Random integer:", randomInt);

  const diceRoll = yield* Random.nextIntBetween(1, 6);
  console.log("Dice roll:", diceRoll);
});
```

## Test Anchors

- `packages/effect/test/Random.test.ts`
- `packages/effect/test/Schedule.test.ts`
- `packages/effect/test/SubscriptionRef.test.ts`

## Top Symbols In Anchored Tests

- `Random` (34)
- `next` (11)
- `withSeed` (11)
- `nextUUIDv4` (7)
- `nextInt` (5)
- `nextIntBetween` (4)
- `nextBetween` (3)
