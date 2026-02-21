# Usage Reference: effect/Channel#core

- Import path: `effect/Channel#core`

## What It Is For

core channel model and constructors. The `Channel` module provides a powerful abstraction for bi-directional communication and streaming operations. A `Channel` is a nexus of I/O operations that supports both reading and writing, forming the foundation for Effect's Stream and Sink abstractions.

## How To Use

- Keep work focused on the `core` concern for `effect/Channel`.
- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Channel } from "effect";

// Simple channel that outputs numbers
const numberChannel = Channel.succeed(42);

// Transform channel that doubles values
const doubleChannel = Channel.map(numberChannel, (n) => n * 2);

// Running the channel would output: 84
```

## Test Anchors

- `packages/effect/test/Channel.test.ts`

## Top Symbols In Anchored Tests

- `runCollect` (24)
- `runDrain` (11)
- `fromArray` (6)
- `fromEffect` (5)
- `fromQueue` (4)
- `fromIterable` (3)
- `fromIterableArray` (3)
- `fromChunk` (2)
- `fromIterator` (2)
- `fromIteratorArray` (2)
