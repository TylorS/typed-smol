---
name: effect-facet-testing-fastcheck
description: Guidance for facet `effect/testing/FastCheck` focused on its core API surface. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet testing/FastCheck

## Owned scope

- Owns only `effect/testing/FastCheck`.
- Parent module: `effect/testing`.
- Source anchor: `packages/effect/src/testing/FastCheck.ts`.

## What it is for

- This module provides a re-export of the fast-check library for property-based testing. Fast-check is a property-based testing framework that generates random test cases to validate that properties hold true for a wide range of inputs.

## API quick reference

- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-testing-testclock` (effect/testing/TestClock)
  - `effect-facet-testing-testconsole` (effect/testing/TestConsole)
  - `effect-facet-testing-testschema` (effect/testing/TestSchema)
- Parent module ownership belongs to `effect-module-testing`.

## Escalate to

- `effect-module-testing` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/testing/FastCheck.ts`
- Parent tests: `packages/effect/test/Stream.test.ts`
- Parent tests: `packages/effect/test/schema/toDifferJsonPatch.test.ts`
- Parent tests: `packages/effect/test/Array.test.ts`
- Parent tests: `packages/effect/test/BigDecimal.test.ts`
- Parent tests: `packages/effect/test/Cache.test.ts`
- Parent tests: `packages/effect/test/Chunk.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
