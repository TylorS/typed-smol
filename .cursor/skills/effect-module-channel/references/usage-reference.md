# Usage Reference: effect/Channel

- Import path: `effect/Channel`

## What It Is For

The `Channel` module provides a powerful abstraction for bi-directional communication and streaming operations. A `Channel` is a nexus of I/O operations that supports both reading and writing, forming the foundation for Effect's Stream and Sink abstractions.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.

## Starter Example

```ts
import { Channel } from "effect"

// Simple channel that outputs numbers
const numberChannel = Channel.succeed(42)

// Transform channel that doubles values
const doubleChannel = Channel.map(numberChannel, (n) => n * 2)

// Running the channel would output: 84
```

## Test Anchors

- `packages/effect/test/Channel.test.ts`

## Top Symbols In Anchored Tests

- `Channel` (124)
- `runCollect` (24)
- `fail` (23)
- `succeed` (21)
- `never` (16)
- `runDrain` (11)
- `merge` (10)
- `filter` (6)
- `fromArray` (6)
- `let` (6)
- `fromEffect` (5)
- `sync` (5)
- `catchIf` (4)
- `catchReason` (4)
- `end` (4)
