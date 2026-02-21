---
name: effect-facet-unstable-cli-prompt
description: Guidance for facet `effect/unstable/cli/Prompt` focused on APIs like map, run, and flatMap. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/cli/Prompt

## Owned scope

- Owns only `effect/unstable/cli/Prompt`.
- Parent module: `effect/unstable/cli`.
- Source anchor: `packages/effect/src/unstable/cli/Prompt.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `map`
- `run`
- `flatMap`
- `succeed`
- `isPrompt`
- `all`
- `All`
- `Any`
- `date`
- `file`
- `list`
- `text`
- `float`
- `Action`
- `custom`
- `hidden`
- `Prompt`
- `Return`
- Full API list: `references/api-reference.md`

## How to use it

- Prefer pipe-based composition to keep transformations explicit and testable.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Effect } from "effect"
import { Prompt } from "effect/unstable/cli"

const username = Prompt.text({
  message: "Enter your username: "
})

const password = Prompt.password({
  message: "Enter your password: ",
  validate: (value) =>
    value.length === 0
      ? Effect.fail("Password cannot be empty")
      : Effect.succeed(value)
})

const allWithTuple = Prompt.all([username, password])

const allWithRecord = Prompt.all({ username, password })
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-cli-argument` (effect/unstable/cli/Argument)
  - `effect-facet-unstable-cli-clierror` (effect/unstable/cli/CliError)
  - `effect-facet-unstable-cli-clioutput` (effect/unstable/cli/CliOutput)
  - `effect-facet-unstable-cli-command` (effect/unstable/cli/Command)
  - `effect-facet-unstable-cli-flag` (effect/unstable/cli/Flag)
  - `effect-facet-unstable-cli-helpdoc` (effect/unstable/cli/HelpDoc)
  - `effect-facet-unstable-cli-param` (effect/unstable/cli/Param)
  - `effect-facet-unstable-cli-primitive` (effect/unstable/cli/Primitive)
- Parent module ownership belongs to `effect-module-unstable-cli`.

## Escalate to

- `effect-module-unstable-cli` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/cli/Prompt.ts`
- Parent tests: `packages/effect/test/unstable/cli/Prompt.test.ts`
- Parent tests: `packages/effect/test/unstable/ai/Prompt.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/completions.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
