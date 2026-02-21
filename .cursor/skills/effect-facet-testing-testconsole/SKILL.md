---
name: effect-facet-testing-testconsole
description: Guidance for facet `effect/testing/TestConsole` focused on APIs like make, layer, and Entry. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet testing/TestConsole

## Owned scope

- Owns only `effect/testing/TestConsole`.
- Parent module: `effect/testing`.
- Source anchor: `packages/effect/src/testing/TestConsole.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `layer`
- `Entry`
- `Method`
- `logLines`
- `errorLines`
- `TestConsole`
- `testConsoleWith`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Console, Effect } from "effect"
import * as TestConsole from "effect/testing/TestConsole"

const program = Effect.gen(function*() {
  yield* Console.log("Hello, World!")
  yield* Console.error("An error occurred")

  const logs = yield* TestConsole.logLines
  const errors = yield* TestConsole.errorLines

  console.log(logs) // [["Hello, World!"]]
  console.log(errors) // [["An error occurred"]]
}).pipe(Effect.provide(TestConsole.layer))
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-testing-fastcheck` (effect/testing/FastCheck)
  - `effect-facet-testing-testclock` (effect/testing/TestClock)
  - `effect-facet-testing-testschema` (effect/testing/TestSchema)
- Parent module ownership belongs to `effect-module-testing`.

## Escalate to

- `effect-module-testing` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/testing/TestConsole.ts`
- Parent tests: `packages/effect/test/Logger.test.ts`
- Parent tests: `packages/effect/test/Array.test.ts`
- Parent tests: `packages/effect/test/BigDecimal.test.ts`
- Parent tests: `packages/effect/test/Cache.test.ts`
- Parent tests: `packages/effect/test/Chunk.test.ts`
- Parent tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
