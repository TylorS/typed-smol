# Usage Reference: effect/Effect#context-di

- Import path: `effect/Effect#context-di`

## What It Is For

provide/service/context operations. The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## How To Use

- Keep work focused on the `context-di` concern for `effect/Effect`.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
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

- `provide` (26)
- `provideService` (6)
- `service` (4)
- `provideServices` (1)
