# Usage Reference: effect/Match#discriminators

- Import path: `effect/Match#discriminators`

## What It Is For

tag/discriminator matching APIs. The `effect/match` module provides a type-safe pattern matching system for TypeScript. Inspired by functional programming, it simplifies conditional logic by replacing verbose if/else or switch statements with a structured and expressive API.

## How To Use

- Keep work focused on the `discriminators` concern for `effect/Match`.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Match } from "effect"

// Simulated dynamic input that can be a string or a number
const input: string | number = "some input"

//      ┌─── string
//      ▼
const result = Match.value(input).pipe(
  // Match if the value is a number
  Match.when(Match.number, (n) => `number: ${n}`),
  // Match if the value is a string
  Match.when(Match.string, (s) => `string: ${s}`),
  // Ensure all possible cases are covered
  Match.exhaustive
)

console.log(result)
// Output: "string: some input"
```

## Test Anchors

- `packages/effect/test/Match.test.ts`

## Top Symbols In Anchored Tests

- `null` (6)
- `orElse` (2)
- `tag` (2)
- `tagStartsWith` (2)
- `type` (2)
