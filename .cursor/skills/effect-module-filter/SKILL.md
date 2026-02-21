---
name: effect-module-filter
description: Guidance for `effect/Filter` focused on APIs like Fail, make, and Filter. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Filter

## Owned scope

- Owns only `effect/Filter`.
- Source of truth: `packages/effect/src/Filter.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Fail`
- `make`
- `Filter`
- `mapFail`
- `makeEffect`
- `FilterEffect`
- `fromPredicate`
- `fromPredicateOption`
- `or`
- `has`
- `try`
- `zip`
- `date`
- `Pass`
- `apply`
- `bigint`
- `equals`
- `number`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Filter, Result } from "effect"

// A filter that only passes positive numbers
const positiveFilter: Filter.Filter<number> = (n) => n > 0 ? Result.succeed(n) : Result.fail(n)

console.log(positiveFilter(5)) // Result.succeed(5)
console.log(positiveFilter(-3)) // Result.fail(-3)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Filter.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/Array.test.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
