# Usage Reference: effect/Logger

- Import path: `effect/Logger`

## What It Is For

The `Logger` module provides a robust and flexible logging system for Effect applications. It offers structured logging, multiple output formats, and seamless integration with the Effect runtime's tracing and context management.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect"

// Basic logging
const program = Effect.gen(function*() {
  yield* Effect.log("Application started")
  yield* Effect.logInfo("Processing user request")
  yield* Effect.logWarning("Resource limit approaching")
  yield* Effect.logError("Database connection failed")
})

// With structured data
const structuredLog = Effect.gen(function*() {
  yield* Effect.log("User action", { userId: 123, action: "login" })
  yield* Effect.logInfo("Request processed", { duration: 150, statusCode: 200 })
})
```

## Test Anchors

- `packages/effect/test/Logger.test.ts`
- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/Stream.test.ts`
- `packages/effect/test/unstable/cli/LogLevel.test.ts`

## Top Symbols In Anchored Tests

- `make` (296)
- `map` (34)
- `Logger` (20)
- `layer` (13)
- `formatJson` (1)
