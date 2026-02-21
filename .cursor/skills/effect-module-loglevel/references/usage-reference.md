# Usage Reference: effect/LogLevel

- Import path: `effect/LogLevel`

## What It Is For

The `LogLevel` module provides utilities for managing log levels in Effect applications. It defines a hierarchy of log levels and provides functions for comparing and filtering logs based on their severity.

## How To Use

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect"

// Basic log level usage
const program = Effect.gen(function*() {
  yield* Effect.logFatal("System is shutting down")
  yield* Effect.logError("Database connection failed")
  yield* Effect.logWarning("Memory usage is high")
  yield* Effect.logInfo("User logged in")
  yield* Effect.logDebug("Processing request")
  yield* Effect.logTrace("Variable value: xyz")
})
```

## Test Anchors

- `packages/effect/test/LogLevel.test.ts`
- `packages/effect/test/unstable/cli/LogLevel.test.ts`
- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/Stream.test.ts`

## Top Symbols In Anchored Tests

- `LogLevel` (40)
- `values` (24)
- `isEnabled` (7)
