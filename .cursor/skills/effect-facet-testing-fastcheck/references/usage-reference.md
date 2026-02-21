# Usage Reference: effect/testing/FastCheck

- Import path: `effect/testing/FastCheck`

## What It Is For

This module provides a re-export of the fast-check library for property-based testing. Fast-check is a property-based testing framework that generates random test cases to validate that properties hold true for a wide range of inputs.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import * as FastCheck from "effect/testing/FastCheck"

// Property: reverse of reverse should equal original
const reverseProp = FastCheck.property(
  FastCheck.array(FastCheck.integer()),
  (arr: Array<number>) => {
    const reversed = arr.slice().reverse()
    const doubleReversed = reversed.slice().reverse()
    return JSON.stringify(arr) === JSON.stringify(doubleReversed)
  }
)

// Run the property test
FastCheck.assert(reverseProp)
```

## Test Anchors

- `packages/effect/test/Stream.test.ts`
- `packages/effect/test/schema/toDifferJsonPatch.test.ts`
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/BigDecimal.test.ts`
- `packages/effect/test/Cache.test.ts`
- `packages/effect/test/Chunk.test.ts`

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
