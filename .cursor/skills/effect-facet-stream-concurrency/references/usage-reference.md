# Usage Reference: effect/Stream#concurrency

- Import path: `effect/Stream#concurrency`

## What It Is For

buffer/share/debounce/throttle behavior. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `concurrency` concern for `effect/Stream`.
- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- This facet is behavior-sensitive; validate edge cases with focused tests before rollout.

## Starter Example

```ts
import { Console, Effect, Stream } from "effect"

const program = Effect.gen(function*() {
  yield* Stream.make(1, 2, 3).pipe(
    Stream.map((n) => n * 2),
    Stream.runForEach((n) => Console.log(n))
  )
})

Effect.runPromise(program)
// Output:
// 2
// 4
// 6
```

## Test Anchors

- `packages/effect/test/Stream.test.ts`
- `packages/effect/test/unstable/process/ChildProcess.test.ts`

## Top Symbols In Anchored Tests

- `fromQueue` (5)
- `raceAll` (5)
- `interruptWhen` (1)
