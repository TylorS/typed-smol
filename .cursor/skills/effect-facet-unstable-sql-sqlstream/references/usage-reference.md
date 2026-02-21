# Usage Reference: effect/unstable/sql/SqlStream

- Import path: `effect/unstable/sql/SqlStream`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { SqlStream } from "effect/unstable/sql/SqlStream"

const value = SqlStream.asyncPauseResume()
```

## Test Anchors

- `packages/effect/test/unstable/sql/SqlSchema.test.ts`

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
