---
name: effect-module-references
description: Guidance for `effect/References` focused on APIs like Scheduler, References, and StackFrame. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module References

## Owned scope

- Owns only `effect/References`.
- Source of truth: `packages/effect/src/References.ts`.

## What it is for

- This module provides a collection of reference implementations for commonly used Effect runtime configuration values. These references allow you to access and modify runtime behavior such as concurrency limits, scheduling policies, tracing configuration, and logging settings.

## API quick reference

- `Scheduler`
- `References`
- `StackFrame`
- `TracerEnabled`
- `CurrentConcurrency`
- `CurrentLogAnnotations`
- `CurrentLogLevel`
- `CurrentLogSpans`
- `CurrentStackFrame`
- `MinimumLogLevel`
- `TracerSpanAnnotations`
- `TracerSpanLinks`
- `TracerTimingEnabled`
- `UnhandledLogLevel`
- Full API list: `references/api-reference.md`

## How to use it

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect, References } from "effect"

const limitConcurrency = Effect.gen(function*() {
  // Get current setting
  const current = yield* References.CurrentConcurrency
  console.log(current) // "unbounded" (default)

  // Run with limited concurrency
  yield* Effect.provideService(
    Effect.gen(function*() {
      const limited = yield* References.CurrentConcurrency
      console.log(limited) // 10
    }),
    References.CurrentConcurrency,
    10
  )

  // Run with unlimited concurrency
  yield* Effect.provideService(
    Effect.gen(function*() {
      const unlimited = yield* References.CurrentConcurrency
      console.log(unlimited) // "unbounded"
    }),
    References.CurrentConcurrency,
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/References.ts`
- Representative tests: `packages/effect/test/LogLevel.test.ts`
- Representative tests: `packages/effect/test/Effect.test.ts`
- Representative tests: `packages/effect/test/Stream.test.ts`
- Representative tests: `packages/effect/test/unstable/http/HttpEffect.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
