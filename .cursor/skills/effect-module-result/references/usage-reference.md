# Usage Reference: effect/Result

- Import path: `effect/Result`

## What It Is For

A synchronous, pure type for representing computations that can succeed (`Success<A>`) or fail (`Failure<E>`). Unlike `Effect`, `Result` is evaluated eagerly and carries no side effects.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

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
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/Brand.test.ts`
- `packages/effect/test/Chunk.test.ts`

## Top Symbols In Anchored Tests

- `Result` (388)
- `succeed` (157)
- `fail` (111)
- `the` (49)
- `gen` (42)
- `andThen` (16)
- `map` (16)
- `all` (13)
- `bindTo` (13)
- `merge` (13)
- `orElse` (12)
- `liftPredicate` (11)
- `flatMap` (10)
- `fromNullishOr` (10)
- `match` (9)
