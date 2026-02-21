---
name: effect-facet-result-combinators
description: Guidance for facet `effect/Result#combinators` focused on APIs like merge and andThen. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Result#combinators

## Owned scope

- Owns only `effect/Result#combinators`.
- Parent module: `effect/Result`.

## What it is for

- map/flatMap/match operations. A synchronous, pure type for representing computations that can succeed (`Success<A>`) or fail (`Failure<E>`). Unlike `Effect`, `Result` is evaluated eagerly and carries no side effects.

## API quick reference

- `merge`
- `andThen`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `combinators` concern for `effect/Result`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Result } from "effect"

const parse = (input: string): Result.Result<number, string> =>
  isNaN(Number(input))
    ? Result.fail("not a number")
    : Result.succeed(Number(input))

const ensurePositive = (n: number): Result.Result<number, string> =>
  n > 0 ? Result.succeed(n) : Result.fail("not positive")

const result = Result.flatMap(parse("42"), ensurePositive)

console.log(Result.getOrElse(result, (err) => `Error: ${err}`))
// Output: 42
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-result-conversions` (effect/Result#conversions)
  - `effect-facet-result-core` (effect/Result#core)
- Parent module ownership belongs to `effect-module-result`.

## Escalate to

- `effect-module-result` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Result.test.ts`
- Parent tests: `packages/effect/test/Channel.test.ts`
- Parent tests: `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
