# Usage Reference: effect/Match#combinators

- Import path: `effect/Match#combinators`

## What It Is For

when/whenOr/whenAnd operators. The `effect/match` module provides a type-safe pattern matching system for TypeScript. Inspired by functional programming, it simplifies conditional logic by replacing verbose if/else or switch statements with a structured and expressive API.

## How To Use

- Keep work focused on the `combinators` concern for `effect/Match`.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

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

- No symbol-frequency matches detected in the selected anchor tests.
