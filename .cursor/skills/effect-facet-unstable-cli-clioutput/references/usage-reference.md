# Usage Reference: effect/unstable/cli/CliOutput

- Import path: `effect/unstable/cli/CliOutput`

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
import { CliOutput } from "effect/unstable/cli";

// Create a custom formatter implementation
const customFormatter: CliOutput.Formatter = {
  formatHelpDoc: (doc) => `Custom Help: ${doc.usage}`,
  formatCliError: (error) => `Error: ${error.message}`,
  formatError: (error) => `[ERROR] ${error.message}`,
  formatVersion: (name, version) => `${name} (${version})`,
  formatErrors: (errors) => errors.map((error) => error.message).join("\\n"),
};

// Use the custom formatter in a program
const program = Effect.gen(function* () {
  const formatter = yield* CliOutput.Formatter;
  const helpText = formatter.formatVersion("myapp", "1.0.0");
  console.log(helpText);
}).pipe(Effect.provide(CliOutput.layer(customFormatter)));
```

## Test Anchors

- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- `packages/effect/test/unstable/cli/completions/completions.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`
- `packages/effect/test/unstable/cli/Help.test.ts`

## Top Symbols In Anchored Tests

- `layer` (16)
- `defaultFormatter` (6)
