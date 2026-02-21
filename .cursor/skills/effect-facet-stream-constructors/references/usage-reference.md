# Usage Reference: effect/Stream#constructors

- Import path: `effect/Stream#constructors`

## What It Is For

stream creation APIs. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `constructors` concern for `effect/Stream`.
- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Console, Effect, Stream } from "effect";

const program = Effect.gen(function* () {
  yield* Stream.make(1, 2, 3).pipe(
    Stream.map((n) => n * 2),
    Stream.runForEach((n) => Console.log(n)),
  );
});

Effect.runPromise(program);
// Output:
// 2
// 4
// 6
```

## Test Anchors

- `packages/effect/test/Stream.test.ts`
- `packages/effect/test/unstable/process/ChildProcess.test.ts`

## Top Symbols In Anchored Tests

- `make` (307)
- `fail` (117)
- `succeed` (79)
- `empty` (71)
- `fromArrays` (22)
- `fromEffect` (22)
- `fromIterable` (15)
- `fromSchedule` (8)
- `fromQueue` (5)
- `fromEffectRepeat` (2)
- `fromArray` (1)
- `fromIterableEffectRepeat` (1)
