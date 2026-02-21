---
name: effect-facet-testing-testschema
description: Guidance for facet `effect/testing/TestSchema` focused on APIs like Asserts and Decoding. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet testing/TestSchema

## Owned scope

- Owns only `effect/testing/TestSchema`.
- Parent module: `effect/testing`.
- Source anchor: `packages/effect/src/testing/TestSchema.ts`.

## What it is for

- Testing utilities for Schema validation and assertions.

## API quick reference

- `Asserts`
- `Decoding`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { TestSchema } from "effect/testing/TestSchema"

const value = TestSchema.Asserts()
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-testing-fastcheck` (effect/testing/FastCheck)
  - `effect-facet-testing-testclock` (effect/testing/TestClock)
  - `effect-facet-testing-testconsole` (effect/testing/TestConsole)
- Parent module ownership belongs to `effect-module-testing`.

## Escalate to

- `effect-module-testing` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/testing/TestSchema.ts`
- Parent tests: `packages/effect/test/testing/TestSchema.test.ts`
- Parent tests: `packages/effect/test/Array.test.ts`
- Parent tests: `packages/effect/test/BigDecimal.test.ts`
- Parent tests: `packages/effect/test/Cache.test.ts`
- Parent tests: `packages/effect/test/Chunk.test.ts`
- Parent tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
