---
name: effect-module-loglevel
description: Guidance for `effect/LogLevel` focused on APIs like getOrdinal, isEnabled, and isLessThan. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module LogLevel

## Owned scope

- Owns only `effect/LogLevel`.
- Source of truth: `packages/effect/src/LogLevel.ts`.

## What it is for

- The `LogLevel` module provides utilities for managing log levels in Effect applications. It defines a hierarchy of log levels and provides functions for comparing and filtering logs based on their severity.

## API quick reference

- `getOrdinal`
- `isEnabled`
- `isLessThan`
- `isGreaterThan`
- `isGreaterThanOrEqualTo`
- `isLessThanOrEqualTo`
- `Order`
- `values`
- `LogLevel`
- `Equivalence`
- Full API list: `references/api-reference.md`

## How to use it

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/LogLevel.ts`
- Representative tests: `packages/effect/test/LogLevel.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/LogLevel.test.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- Representative tests: `packages/effect/test/Stream.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
