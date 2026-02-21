---
name: effect-module-match
description: Guidance for `effect/Match` focused on APIs like is, any, and not. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Match

## Owned scope

- Owns only `effect/Match`.
- Source of truth: `packages/effect/src/Match.ts`.

## What it is for

- The `effect/match` module provides a type-safe pattern matching system for TypeScript. Inspired by functional programming, it simplifies conditional logic by replacing verbose if/else or switch statements with a structured and expressive API.

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

- Deep module subsets are owned by these facet skills:
  - `effect-facet-match-combinators` (effect/Match#combinators)
  - `effect-facet-match-core` (effect/Match#core)
  - `effect-facet-match-discriminators` (effect/Match#discriminators)
  - `effect-facet-match-predicates` (effect/Match#predicates)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-match-combinators`.

## Reference anchors

- Module source: `packages/effect/src/Match.ts`
- Representative tests: `packages/effect/test/Match.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
