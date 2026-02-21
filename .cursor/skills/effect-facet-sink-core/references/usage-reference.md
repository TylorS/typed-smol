# Usage Reference: effect/Sink#core

- Import path: `effect/Sink#core`

## What It Is For

sink model and base constructors. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `core` concern for `effect/Sink`.
- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect";
import * as Sink from "effect/Sink";
import * as Stream from "effect/Stream";

// Create a simple sink that always succeeds with a value
const sink: Sink.Sink<number> = Sink.succeed(42);

// Use the sink to consume a stream
const stream = Stream.make(1, 2, 3);
const program = Stream.run(stream, sink);

Effect.runPromise(program).then(console.log);
// Output: 42
```

## Test Anchors

- `packages/effect/test/Sink.test.ts`
- `packages/effect/test/unstable/process/ChildProcess.test.ts`

## Top Symbols In Anchored Tests

- `make` (46)
