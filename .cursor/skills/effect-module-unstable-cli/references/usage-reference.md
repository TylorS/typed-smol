# Usage Reference: effect/unstable/cli

- Import path: `effect/unstable/cli`

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
import { cli } from "effect/unstable/cli"

const value = cli.Flag()
```

## Test Anchors

- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- `packages/effect/test/unstable/cli/completions/completions.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`
- `packages/effect/test/unstable/cli/Help.test.ts`

## Top Symbols In Anchored Tests

- `Command` (154)
- `Flag` (80)
- `Argument` (65)
- `CliOutput` (13)
- `CliError` (11)
