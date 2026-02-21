---
name: effect-facet-unstable-cli-helpdoc
description: Guidance for facet `effect/unstable/cli/HelpDoc` focused on APIs like ArgDoc, FlagDoc, and HelpDoc. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/cli/HelpDoc

## Owned scope

- Owns only `effect/unstable/cli/HelpDoc`.
- Parent module: `effect/unstable/cli`.
- Source anchor: `packages/effect/src/unstable/cli/HelpDoc.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `ArgDoc`
- `FlagDoc`
- `HelpDoc`
- `SubcommandDoc`
- Full API list: `references/api-reference.md`

## How to use it

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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
  - `effect-facet-unstable-cli-param` (effect/unstable/cli/Param)
  - `effect-facet-unstable-cli-primitive` (effect/unstable/cli/Primitive)
  - `effect-facet-unstable-cli-prompt` (effect/unstable/cli/Prompt)
- Parent module ownership belongs to `effect-module-unstable-cli`.

## Escalate to

- `effect-module-unstable-cli` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/cli/HelpDoc.ts`
- Parent tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/completions.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Errors.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Help.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
