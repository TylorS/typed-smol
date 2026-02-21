# Usage Reference: effect/Effect#concurrency

- Import path: `effect/Effect#concurrency`

## What It Is For

fork/race/concurrency control. The `Effect` module is the core of the Effect library, providing a powerful and expressive way to model and compose asynchronous, concurrent, and effectful computations.

## How To Use

- Keep work focused on the `concurrency` concern for `effect/Effect`.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- This facet is behavior-sensitive; validate edge cases with focused tests before rollout.

## Starter Example

```ts
import { Console, Effect } from "effect";

// Creating a simple effect
const hello = Effect.succeed("Hello, World!");

// Composing effects
const program = Effect.gen(function* () {
  const message = yield* hello;
  yield* Console.log(message);
  return message.length;
});

// Running the effect
Effect.runPromise(program).then(console.log); // 13
```

## Test Anchors

- `packages/effect/test/Effect.test.ts`
- `packages/effect/test/Channel.test.ts`
- `packages/effect/test/Deferred.test.ts`
- `packages/effect/test/Layer.test.ts`
- `packages/effect/test/Logger.test.ts`
- `packages/effect/test/LogLevel.test.ts`

## Top Symbols In Anchored Tests

- `fiber` (84)
- `forkChild` (42)
- `interrupt` (37)
- `uninterruptible` (14)
- `onInterrupt` (13)
- `interruptible` (6)
- `forkDetach` (2)
- `forkIn` (2)
- `forkScoped` (2)
- `raceAll` (2)
- `raceAllFirst` (2)
- `runFork` (2)
- `fnUntraced` (1)
- `race` (1)
- `withConcurrency` (1)
