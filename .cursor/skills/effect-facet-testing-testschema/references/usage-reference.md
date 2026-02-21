# Usage Reference: effect/testing/TestSchema

- Import path: `effect/testing/TestSchema`

## What It Is For

Testing utilities for Schema validation and assertions.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { TestSchema } from "effect/testing/TestSchema"

const value = TestSchema.Asserts()
```

## Test Anchors

- `packages/effect/test/testing/TestSchema.test.ts`
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/BigDecimal.test.ts`
- `packages/effect/test/Cache.test.ts`
- `packages/effect/test/Chunk.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`

## Top Symbols In Anchored Tests

- `Asserts` (5)
