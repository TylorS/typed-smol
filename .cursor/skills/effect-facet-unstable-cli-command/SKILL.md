---
name: effect-facet-unstable-cli-command
description: Guidance for facet `effect/unstable/cli/Command` focused on APIs like run, make, and provide. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/cli/Command

## Owned scope

- Owns only `effect/unstable/cli/Command`.
- Parent module: `effect/unstable/cli`.
- Source anchor: `packages/effect/src/unstable/cli/Command.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `run`
- `make`
- `provide`
- `runWith`
- `provideSync`
- `ParsedTokens`
- `provideEffect`
- `provideEffectDiscard`
- `isCommand`
- `Any`
- `Error`
- `Infer`
- `Config`
- `Command`
- `InferValue`
- `Environment`
- `withHandler`
- `CommandContext`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

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

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-cli-argument` (effect/unstable/cli/Argument)
  - `effect-facet-unstable-cli-clierror` (effect/unstable/cli/CliError)
  - `effect-facet-unstable-cli-clioutput` (effect/unstable/cli/CliOutput)
  - `effect-facet-unstable-cli-flag` (effect/unstable/cli/Flag)
  - `effect-facet-unstable-cli-helpdoc` (effect/unstable/cli/HelpDoc)
  - `effect-facet-unstable-cli-param` (effect/unstable/cli/Param)
  - `effect-facet-unstable-cli-primitive` (effect/unstable/cli/Primitive)
  - `effect-facet-unstable-cli-prompt` (effect/unstable/cli/Prompt)
- Parent module ownership belongs to `effect-module-unstable-cli`.

## Escalate to

- `effect-module-unstable-cli` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/cli/Command.ts`
- Parent tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/completions.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Errors.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Help.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
