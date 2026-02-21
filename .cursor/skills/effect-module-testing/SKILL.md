---
name: effect-module-testing
description: Guidance for `effect/testing` focused on APIs like FastCheck, TestClock, and TestSchema. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module testing

## Owned scope

- Owns only `effect/testing`.
- Source of truth: `packages/effect/src/testing/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `FastCheck`
- `TestClock`
- `TestSchema`
- `TestConsole`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { testing } from "effect/testing"

const value = testing.FastCheck()
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-testing-fastcheck` (effect/testing/FastCheck)
  - `effect-facet-testing-testclock` (effect/testing/TestClock)
  - `effect-facet-testing-testconsole` (effect/testing/TestConsole)
  - `effect-facet-testing-testschema` (effect/testing/TestSchema)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-testing-fastcheck`.

## Reference anchors

- Module source: `packages/effect/src/testing/index.ts`
- Representative tests: `packages/effect/test/Array.test.ts`
- Representative tests: `packages/effect/test/BigDecimal.test.ts`
- Representative tests: `packages/effect/test/Cache.test.ts`
- Representative tests: `packages/effect/test/Chunk.test.ts`
- Representative tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- Representative tests: `packages/effect/test/cluster/MessageStorage.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
