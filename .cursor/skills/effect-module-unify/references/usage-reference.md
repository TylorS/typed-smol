# Usage Reference: effect/Unify

- Import path: `effect/Unify`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import type { Unify } from "effect"

// The unifySymbol is used internally in Effect types
// to enable automatic type unification
declare const effect: {
  readonly [Unify.unifySymbol]?: any
}
```

## Test Anchors

- `packages/effect/test/unstable/http/Multipart.test.ts`

## Top Symbols In Anchored Tests

- `Unify` (2)
- `unify` (1)
