# Usage Reference: effect/Channel#composition

- Import path: `effect/Channel#composition`

## What It Is For

sequencing/transformation pipelines. The `Channel` module provides a powerful abstraction for bi-directional communication and streaming operations. A `Channel` is a nexus of I/O operations that supports both reading and writing, forming the foundation for Effect's Stream and Sink abstractions.

## How To Use

- Keep work focused on the `composition` concern for `effect/Channel`.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

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

- `merge` (10)
- `mapEffect` (4)
- `map` (2)
- `mapDone` (2)
- `switchMap` (2)
