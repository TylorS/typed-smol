# Usage Reference: effect/Stream#transforms

- Import path: `effect/Stream#transforms`

## What It Is For

map/filter/flatMap style transforms. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `transforms` concern for `effect/Stream`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

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

- `flatMap` (38)
- `map` (27)
- `decodeText` (4)
- `mapEffect` (4)
- `filter` (3)
