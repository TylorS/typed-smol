# Usage Reference: effect/Pipeable

- Import path: `effect/Pipeable`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect";

// The Pipeable interface allows Effect values to be chained using the pipe method
const program = Effect.succeed(1).pipe(
  Effect.map((x) => x + 1),
  Effect.flatMap((x) => Effect.succeed(x * 2)),
  Effect.tap((x) => Effect.log(`Result: ${x}`)),
);
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
