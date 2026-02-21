# Usage Reference: effect/Effect#constructors

- Import path: `effect/Effect#constructors`

## What It Is For

Creation and lifting APIs. The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## How To Use

- Keep work focused on the `constructors` concern for `effect/Effect`.
- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

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
- `succeed` (139)
- `failSync` (12)
- `failCause` (6)
- `fromNullishOr` (2)
- `fromResult` (2)
- `fromOption` (1)
