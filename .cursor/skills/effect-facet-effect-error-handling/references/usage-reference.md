# Usage Reference: effect/Effect#error-handling

- Import path: `effect/Effect#error-handling`

## What It Is For

catch/match/retry/recover flows. The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## How To Use

- Keep work focused on the `error-handling` concern for `effect/Effect`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- This facet is behavior-sensitive; validate edge cases with focused tests before rollout.

## Starter Example

```ts
import { Console, Effect } from "effect"

// Creating a simple effect
const hello = Effect.succeed("Hello, World!")

// Composing effects
const program = Effect.gen(function*() {
  const message = yield* hello
  yield* Console.log(message)
  return message.length
})

// Running the effect
Effect.runPromise(program).then(console.log) // 13
```

## Test Anchors

- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/Deferred.test.ts`
- `packages/effect/test/Layer.test.ts`
- `packages/effect/test/Logger.test.ts`
- `packages/effect/test/LogLevel.test.ts`

## Top Symbols In Anchored Tests

- `fail` (148)
- `retry` (33)
- `match` (16)
- `Error` (12)
- `failSync` (12)
- `catchIf` (11)
- `catchReason` (10)
- `catchTag` (9)
- `catchCauseIf` (7)
- `catchReasons` (7)
- `failCause` (6)
- `tapCauseIf` (6)
- `catchNoSuchElement` (5)
- `ignoreCause` (5)
- `onErrorIf` (5)
