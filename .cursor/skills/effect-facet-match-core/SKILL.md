---
name: effect-facet-match-core
description: Guidance for facet `effect/Match#core` focused on APIs like is, any, and not. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet Match#core

## Owned scope

- Owns only `effect/Match#core`.
- Parent module: `effect/Match`.

## What it is for

- matcher model and constructors. The `effect/match` module provides a type-safe pattern matching system for TypeScript. Inspired by functional programming, it simplifies conditional logic by replacing verbose if/else or switch statements with a structured and expressive API.

## API quick reference

- `is`
- `any`
- `not`
- `Not`
- `tag`
- `Case`
- `date`
- `null`
- `Only`
- `tags`
- `Tags`
- `type`
- `when`
- `When`
- `Types`
- `value`
- `bigint`
- `number`
- Full API list: `references/api-reference.md`

## How to use it

- Keep work focused on the `core` concern for `effect/Match`.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Match } from "effect";

// Simulated dynamic input that can be a string or a number
const input: string | number = "some input";

//      ┌─── string
//      ▼
const result = Match.value(input).pipe(
  // Match if the value is a number
  Match.when(Match.number, (n) => `number: ${n}`),
  // Match if the value is a string
  Match.when(Match.string, (s) => `string: ${s}`),
  // Ensure all possible cases are covered
  Match.exhaustive,
);

console.log(result);
// Output: "string: some input"
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-match-combinators` (effect/Match#combinators)
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
