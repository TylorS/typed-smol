# Usage Reference: effect/unstable/cli/Prompt

- Import path: `effect/unstable/cli/Prompt`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Prefer pipe-based composition to keep transformations explicit and testable.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Effect } from "effect";
import { Prompt } from "effect/unstable/cli";

const username = Prompt.text({
  message: "Enter your username: ",
});

const password = Prompt.password({
  message: "Enter your password: ",
  validate: (value) =>
    value.length === 0 ? Effect.fail("Password cannot be empty") : Effect.succeed(value),
});

const allWithTuple = Prompt.all([username, password]);

const allWithRecord = Prompt.all({ username, password });
```

## Test Anchors

- `packages/effect/test/unstable/cli/Prompt.test.ts`
- `packages/effect/test/unstable/ai/Prompt.test.ts`
- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- `packages/effect/test/unstable/cli/completions/completions.test.ts`

## Top Symbols In Anchored Tests

- `Prompt` (74)
- `file` (43)
- `run` (40)
- `text` (38)
- `integer` (29)
- `all` (6)
- `autoComplete` (6)
- `succeed` (6)
- `float` (5)
- `list` (3)
- `date` (2)
- `map` (2)
- `password` (2)
- `All` (1)
