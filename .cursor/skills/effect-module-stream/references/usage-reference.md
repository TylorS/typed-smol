# Usage Reference: effect/Stream

- Import path: `effect/Stream`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

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
- `packages/effect/test/cluster/Sharding.test.ts`
- `packages/effect/test/ExecutionPlan.test.ts`
- `packages/effect/test/HttpClient.test.ts`
- `packages/effect/test/Queue.test.ts`

## Top Symbols In Anchored Tests

- `Stream` (1203)
- `Effect` (753)
- `result` (449)
- `make` (319)
- `runCollect` (253)
- `fail` (126)
- `succeed` (84)
- `empty` (80)
- `concat` (67)
- `range` (63)
- `take` (60)
- `provide` (56)
- `flatMap` (45)
- `chunks` (32)
- `map` (31)
