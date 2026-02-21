# Usage Reference: effect/Result#conversions

- Import path: `effect/Result#conversions`

## What It Is For

interop and fallback conversions. A synchronous, pure type for representing computations that can succeed (`Success<A>`) or fail (`Failure<E>`). Unlike `Effect`, `Result` is evaluated eagerly and carries no side effects.

## How To Use

- Keep work focused on the `conversions` concern for `effect/Result`.
- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Result.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/schema/representation/toCodeDocument.test.ts`

## Top Symbols In Anchored Tests

- `orElse` (12)
- `bindTo` (9)
- `liftPredicate` (9)
- `fromNullishOr` (6)
- `transposeMapOption` (6)
- `fromOption` (5)
- `getOrElse` (5)
- `getOrThrowWith` (5)
- `transposeOption` (4)
- `getOrNull` (3)
- `getOrThrow` (3)
- `getOrUndefined` (3)
