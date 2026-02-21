# Usage Reference: effect/Runtime

- Import path: `effect/Runtime`

## What It Is For

This module provides utilities for running Effect programs and managing their execution lifecycle.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect, Fiber, Runtime } from "effect"

// Create a main runner for Node.js
const runMain = Runtime.makeRunMain((options) => {
  process.on("SIGINT", () => Effect.runFork(Fiber.interrupt(options.fiber)))
  process.on("SIGTERM", () => Effect.runFork(Fiber.interrupt(options.fiber)))

  options.fiber.addObserver((exit) => {
    options.teardown(exit, (code) => process.exit(code))
  })
})

// Use the runner
const program = Effect.log("Hello, World!")
runMain(program)
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
