# Usage Reference: effect/Function#constants

- Import path: `effect/Function#constants`

## What It Is For

constant helper functions. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `constants` concern for `effect/Function`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import type { FunctionTypeLambda } from "effect/Function";
import type { Kind } from "effect/HKT";

// Create a function type using the type lambda
type StringToNumber = Kind<FunctionTypeLambda, string, never, never, number>;
// Equivalent to: (a: string) => number
```

## Test Anchors

- `packages/effect/test/Array.test.ts`
- `packages/effect/test/Chunk.test.ts`
- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/Iterable.test.ts`
- `packages/effect/test/PubSub.test.ts`
- `packages/effect/test/Record.test.ts`

## Top Symbols In Anchored Tests

- `pipe` (677)
- `flip` (33)
- `identity` (7)
- `constFalse` (6)
- `satisfies` (6)
- `constTrue` (5)
- `compose` (1)
