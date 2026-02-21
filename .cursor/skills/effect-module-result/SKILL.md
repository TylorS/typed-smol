---
name: effect-module-result
description: Guidance for `effect/Result` focused on APIs like gen, map, and fail. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Result

## Owned scope

- Owns only `effect/Result`.
- Source of truth: `packages/effect/src/Result.ts`.

## What it is for

- A synchronous, pure type for representing computations that can succeed (`Success<A>`) or fail (`Failure<E>`). Unlike `Effect`, `Result` is evaluated eagerly and carries no side effects.

## API quick reference

- `gen`
- `map`
- `fail`
- `Failure`
- `flatMap`
- `mapBoth`
- `succeed`
- `failVoid`
- `mapError`
- `getOrElse`
- `getOrNull`
- `fromOption`
- `getFailure`
- `getOrThrow`
- `getSuccess`
- `succeedNone`
- `succeedSome`
- `filterOrFail`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Starter example

```ts
import { Result } from "effect";

const parse = (input: string): Result.Result<number, string> =>
  isNaN(Number(input)) ? Result.fail("not a number") : Result.succeed(Number(input));

const ensurePositive = (n: number): Result.Result<number, string> =>
  n > 0 ? Result.succeed(n) : Result.fail("not positive");

const result = Result.flatMap(parse("42"), ensurePositive);

console.log(Result.getOrElse(result, (err) => `Error: ${err}`));
// Output: 42
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-result-combinators` (effect/Result#combinators)
  - `effect-facet-result-conversions` (effect/Result#conversions)
  - `effect-facet-result-core` (effect/Result#core)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-result-combinators`.

## Reference anchors

- Module source: `packages/effect/src/Result.ts`
- Representative tests: `packages/effect/test/Result.test.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- Representative tests: `packages/effect/test/Array.test.ts`
- Representative tests: `packages/effect/test/Brand.test.ts`
- Representative tests: `packages/effect/test/Chunk.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
