# Usage Reference: effect/Pull

- Import path: `effect/Pull`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Cause, Effect, Pull } from "effect"

const pull = Cause.done("stream ended")

const result = Pull.matchEffect(pull, {
  onSuccess: (value) => Effect.succeed(`Got value: ${value}`),
  onFailure: (cause) => Effect.succeed(`Got error: ${cause}`),
  onDone: (leftover) => Effect.succeed(`Stream halted with: ${leftover}`)
})
```

## Test Anchors

- `packages/effect/test/Schedule.test.ts`
- `packages/effect/test/SubscriptionRef.test.ts`

## Top Symbols In Anchored Tests

- `Error` (6)
- `Pull` (4)
- `catchDone` (1)
- `isDoneCause` (1)
