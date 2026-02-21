---
name: effect-facet-match-combinators
description: Guidance for facet `effect/Match#combinators` focused on APIs like ArrayToIntersection. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Match#combinators

## Owned scope

- Owns only `effect/Match#combinators`.
- Parent module: `effect/Match`.

## What it is for

- when/whenOr/whenAnd operators. The `effect/match` module provides a type-safe pattern matching system for TypeScript. Inspired by functional programming, it simplifies conditional logic by replacing verbose if/else or switch statements with a structured and expressive API.

## API quick reference

- `ArrayToIntersection`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `combinators` concern for `effect/Match`.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-match-core` (effect/Match#core)
  - `effect-facet-match-discriminators` (effect/Match#discriminators)
  - `effect-facet-match-predicates` (effect/Match#predicates)
- Parent module ownership belongs to `effect-module-match`.

## Escalate to

- `effect-module-match` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Parent tests: `packages/effect/test/Match.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
