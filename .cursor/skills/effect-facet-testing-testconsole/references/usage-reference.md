# Usage Reference: effect/testing/TestConsole

- Import path: `effect/testing/TestConsole`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Logger.test.ts`
- `packages/effect/test/Array.test.ts`
- `packages/effect/test/BigDecimal.test.ts`
- `packages/effect/test/Cache.test.ts`
- `packages/effect/test/Chunk.test.ts`
- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`

## Top Symbols In Anchored Tests

- `make` (392)
- `layer` (7)
- `TestConsole` (3)
- `Entry` (1)
- `logLines` (1)
