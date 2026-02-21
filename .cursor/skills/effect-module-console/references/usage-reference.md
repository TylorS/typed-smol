# Usage Reference: effect/Console

- Import path: `effect/Console`

## What It Is For

The `Console` module provides a functional interface for console operations within the Effect ecosystem. It offers type-safe logging, debugging, and console manipulation capabilities with built-in support for testing and environment isolation.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Console, Effect } from "effect";

// Basic logging
const program = Effect.gen(function* () {
  yield* Console.log("Hello, World!");
  yield* Console.error("Something went wrong");
  yield* Console.warn("This is a warning");
  yield* Console.info("Information message");
});
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
