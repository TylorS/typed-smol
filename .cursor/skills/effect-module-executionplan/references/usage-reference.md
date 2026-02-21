# Usage Reference: effect/ExecutionPlan

- Import path: `effect/ExecutionPlan`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import type { Layer } from "effect"
import { Effect, ExecutionPlan, Schedule } from "effect"
import type { LanguageModel } from "effect/unstable/ai"

declare const layerBad: Layer.Layer<LanguageModel.LanguageModel>
declare const layerGood: Layer.Layer<LanguageModel.LanguageModel>

const ThePlan = ExecutionPlan.make(
  {
    // First try with the bad layer 2 times with a 3 second delay between attempts
    provide: layerBad,
    attempts: 2,
    schedule: Schedule.spaced(3000)
  },
  // Then try with the bad layer 3 times with a 1 second delay between attempts
  {
    provide: layerBad,
    attempts: 3,
    schedule: Schedule.spaced(1000)
  },
  // Finally try with the good layer.
  //
  // If `attempts` is omitted, the plan will only attempt once, unless a schedule is provided.
  {
```

## Test Anchors

- `packages/effect/test/ExecutionPlan.test.ts`

## Top Symbols In Anchored Tests

- `ExecutionPlan` (6)
- `make` (6)
- `CurrentMetadata` (1)
- `Metadata` (1)
