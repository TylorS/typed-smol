# Usage Reference: effect/unstable/cli/CliError

- Import path: `effect/unstable/cli/CliError`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect";
import { CliError } from "effect/unstable/cli";

const handleError = (error: unknown) => {
  if (CliError.isCliError(error)) {
    console.log("CLI Error:", error.message);
    return Effect.succeed("Handled CLI error");
  }
  return Effect.fail("Unknown error");
};

// Example usage in error handling
const program = Effect.gen(function* () {
  const result = yield* Effect.try({
    try: () => ({ success: true }),
    catch: (error) => error,
  });
  handleError(result);
});
```

## Test Anchors

- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- `packages/effect/test/unstable/cli/completions/completions.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`
- `packages/effect/test/unstable/cli/Help.test.ts`

## Top Symbols In Anchored Tests

- `CliError` (11)
- `UnrecognizedOption` (5)
- `DuplicateOption` (4)
- `MissingOption` (4)
- `UnknownSubcommand` (3)
- `MissingArgument` (1)
