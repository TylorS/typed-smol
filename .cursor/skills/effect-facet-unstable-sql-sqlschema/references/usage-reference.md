# Usage Reference: effect/unstable/sql/SqlSchema

- Import path: `effect/unstable/sql/SqlSchema`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { SqlSchema } from "effect/unstable/sql/SqlSchema"

const value = SqlSchema.void()
```

## Test Anchors

- `packages/effect/test/unstable/sql/SqlSchema.test.ts`

## Top Symbols In Anchored Tests

- `findOneOption` (4)
- `findOne` (3)
