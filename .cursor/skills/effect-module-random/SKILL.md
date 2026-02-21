---
name: effect-module-random
description: Guidance for `effect/Random` focused on APIs like next, Random, and nextInt. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Random

## Owned scope

- Owns only `effect/Random`.
- Source of truth: `packages/effect/src/Random.ts`.

## What it is for

- The Random module provides a service for generating random numbers in Effect programs. It offers a testable and composable way to work with randomness, supporting integers, floating-point numbers, and range-based generation.

## API quick reference

- `next`
- `Random`
- `nextInt`
- `withSeed`
- `nextUUIDv4`
- `nextBetween`
- `nextIntBetween`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, Random } from "effect"

const program = Effect.gen(function*() {
  const randomFloat = yield* Random.next
  console.log("Random float:", randomFloat)

  const randomInt = yield* Random.nextInt
  console.log("Random integer:", randomInt)

  const diceRoll = yield* Random.nextIntBetween(1, 6)
  console.log("Dice roll:", diceRoll)
})
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Random.ts`
- Representative tests: `packages/effect/test/Random.test.ts`
- Representative tests: `packages/effect/test/Schedule.test.ts`
- Representative tests: `packages/effect/test/SubscriptionRef.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
