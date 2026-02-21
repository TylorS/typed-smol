---
name: effect-module-runtime
description: Guidance for `effect/Runtime` focused on APIs like makeRunMain, Teardown, and defaultTeardown. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Runtime

## Owned scope

- Owns only `effect/Runtime`.
- Source of truth: `packages/effect/src/Runtime.ts`.

## What it is for

- This module provides utilities for running Effect programs and managing their execution lifecycle.

## API quick reference

- `makeRunMain`
- `Teardown`
- `defaultTeardown`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Runtime.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
