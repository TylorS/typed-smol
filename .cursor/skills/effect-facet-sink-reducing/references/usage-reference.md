# Usage Reference: effect/Sink#reducing

- Import path: `effect/Sink#reducing`

## What It Is For

reduce/fold aggregation behavior. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `reducing` concern for `effect/Sink`.
- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect"
import * as Sink from "effect/Sink"
import * as Stream from "effect/Stream"

// Create a simple sink that always succeeds with a value
const sink: Sink.Sink<number> = Sink.succeed(42)

// Use the sink to consume a stream
const stream = Stream.make(1, 2, 3)
const program = Stream.run(stream, sink)

Effect.runPromise(program).then(console.log)
// Output: 42
```

## Test Anchors

- `packages/effect/test/Sink.test.ts`
- `packages/effect/test/unstable/process/ChildProcess.test.ts`

## Top Symbols In Anchored Tests

- `make` (46)
- `Sink` (28)
- `flatMap` (9)
- `as` (7)
- `head` (6)
- `succeed` (6)
- `count` (5)
- `reduceWhile` (5)
- `reduce` (4)
- `take` (4)
- `map` (3)
- `never` (3)
- `fail` (2)
- `reduceWhileEffect` (2)
- `drain` (1)
