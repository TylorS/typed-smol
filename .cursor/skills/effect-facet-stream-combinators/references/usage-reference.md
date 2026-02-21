# Usage Reference: effect/Stream#combinators

- Import path: `effect/Stream#combinators`

## What It Is For

merge/zip/grouping composition. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `combinators` concern for `effect/Stream`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

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

- `zipWith` (16)
- `zipWithArray` (13)
- `zip` (12)
- `zipFlatten` (12)
- `zipLatestWith` (10)
- `zipLeft` (10)
- `zipRight` (10)
- `zipLatest` (9)
- `zipWithIndex` (9)
- `zipWithPrevious` (8)
- `zipWithNext` (7)
- `zipWithPreviousAndNext` (4)
- `mergeResult` (1)
