# Usage Reference: effect/unstable/cli/Command

- Import path: `effect/unstable/cli/Command`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Console } from "effect"
import { Argument, Command, Flag } from "effect/unstable/cli"

// Simple command with no configuration
const version: Command.Command<"version", {}, never, never> = Command.make(
  "version"
)

// Command with flags and arguments
const deploy: Command.Command<
  "deploy",
  {
    readonly env: string
    readonly force: boolean
    readonly files: ReadonlyArray<string>
  },
  never,
  never
> = Command.make("deploy", {
  env: Flag.string("env"),
  force: Flag.boolean("force"),
  files: Argument.string("files").pipe(Argument.variadic())
})

```

## Test Anchors

- `packages/effect/test/unstable/cli/Command.test.ts`
- `packages/effect/test/unstable/cli/Arguments.test.ts`
- `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- `packages/effect/test/unstable/cli/completions/completions.test.ts`
- `packages/effect/test/unstable/cli/Errors.test.ts`
- `packages/effect/test/unstable/cli/Help.test.ts`

## Top Symbols In Anchored Tests

- `Command` (154)
- `make` (88)
- `provide` (61)
- `withSubcommands` (34)
- `run` (33)
- `runWith` (33)
- `withDescription` (29)
- `Error` (4)
