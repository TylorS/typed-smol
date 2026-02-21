# Usage Reference: effect/testing

- Import path: `effect/testing`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { testing } from "effect/testing"

const value = testing.FastCheck()
```

## Test Anchors

- `packages/effect/test/Array.test.ts`
- `packages/effect/test/BigDecimal.test.ts`
- `packages/effect/test/Cache.test.ts`
- `packages/effect/test/Chunk.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`

## Top Symbols In Anchored Tests

- `TestClock` (69)
- `FastCheck` (3)
