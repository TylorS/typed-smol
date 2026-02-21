---
name: effect-module-logger
description: Guidance for `effect/Logger` focused on APIs like map, make, and layer. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Logger

## Owned scope

- Owns only `effect/Logger`.
- Source of truth: `packages/effect/src/Logger.ts`.

## What it is for

- The `Logger` module provides a robust and flexible logging system for Effect applications. It offers structured logging, multiple output formats, and seamless integration with the Effect runtime's tracing and context management.

## API quick reference

- `map`
- `make`
- `layer`
- `isLogger`
- `Logger`
- `toFile`
- `batched`
- `Options`
- `Variance`
- `formatJson`
- `consoleJson`
- `LogToStderr`
- `formatLogFmt`
- `formatSimple`
- `tracerLogger`
- `consoleLogFmt`
- `consolePretty`
- `defaultLogger`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect } from "effect";

// Basic logging
const program = Effect.gen(function* () {
  yield* Effect.log("Application started");
  yield* Effect.logInfo("Processing user request");
  yield* Effect.logWarning("Resource limit approaching");
  yield* Effect.logError("Database connection failed");
});

// With structured data
const structuredLog = Effect.gen(function* () {
  yield* Effect.log("User action", { userId: 123, action: "login" });
  yield* Effect.logInfo("Request processed", { duration: 150, statusCode: 200 });
});
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Logger.ts`
- Representative tests: `packages/effect/test/Logger.test.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- Representative tests: `packages/effect/test/Stream.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/LogLevel.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
