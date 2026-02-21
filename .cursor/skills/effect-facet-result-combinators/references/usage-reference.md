# Usage Reference: effect/Result#combinators

- Import path: `effect/Result#combinators`

## What It Is For

map/flatMap/match operations. A synchronous, pure type for representing computations that can succeed (`Success<A>`) or fail (`Failure<E>`). Unlike `Effect`, `Result` is evaluated eagerly and carries no side effects.

## How To Use

- Keep work focused on the `combinators` concern for `effect/Result`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Result.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/schema/representation/toCodeDocument.test.ts`

## Top Symbols In Anchored Tests

- `andThen` (16)
- `merge` (13)
