# Usage Reference: effect/unstable/cli/HelpDoc

- Import path: `effect/unstable/cli/HelpDoc`

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
import type * as HelpDoc from "effect/unstable/cli/HelpDoc"

const deployCommandHelp: HelpDoc.HelpDoc = {
  description: "Deploy your application to the cloud",
  usage: "myapp deploy [options] <target>",
  flags: [
    {
      name: "verbose",
      aliases: ["-v"],
      type: "boolean",
      description: "Enable verbose logging",
      required: false
    },
    {
      name: "env",
      aliases: ["-e"],
      type: "string",
      description: "Target environment",
      required: true
    }
  ],
  args: [
    {
      name: "target",
```

## Test Anchors

- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- `packages/effect/test/unstable/cli/completions/completions.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`
- `packages/effect/test/unstable/cli/Help.test.ts`

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
