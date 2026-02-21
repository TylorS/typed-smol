# Usage Reference: effect/Tracer

- Import path: `effect/Tracer`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import type { Tracer } from "effect"
import { Exit } from "effect"

// Started span status
const startedStatus: Tracer.SpanStatus = {
  _tag: "Started",
  startTime: BigInt(Date.now() * 1000000)
}

// Ended span status
const endedStatus: Tracer.SpanStatus = {
  _tag: "Ended",
  startTime: BigInt(Date.now() * 1000000),
  endTime: BigInt(Date.now() * 1000000 + 1000000),
  exit: Exit.succeed("result")
}
```

## Test Anchors

- `packages/effect/test/Tracer.test.ts`

## Top Symbols In Anchored Tests

- `Tracer` (13)
- `Span` (6)
- `DisablePropagation` (4)
- `ExternalSpan` (2)
- `externalSpan` (1)
- `make` (1)
- `MinimumTraceLevel` (1)
- `NativeSpan` (1)
