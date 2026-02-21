# Usage Reference: effect/Effect#composition

- Import path: `effect/Effect#composition`

## What It Is For

map/flatMap/zip/all composition APIs. The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## How To Use

- Keep work focused on the `composition` concern for `effect/Effect`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

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
- `andThen` (15)
- `map` (9)
- `flatMap` (7)
- `provideService` (6)
- `zip` (3)
- `zipWith` (3)
- `provideServices` (1)
