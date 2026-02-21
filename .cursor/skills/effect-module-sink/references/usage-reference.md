# Usage Reference: effect/Sink

- Import path: `effect/Sink`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

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
- `packages/effect/test/Stream.test.ts`

## Top Symbols In Anchored Tests

- `make` (317)
- `fail` (119)
- `succeed` (81)
- `as` (78)
- `Sink` (54)
- `flatMap` (47)
- `take` (44)
- `map` (30)
- `fromEffect` (22)
- `never` (20)
- `sync` (18)
- `some` (16)
- `head` (13)
- `die` (11)
- `count` (8)
