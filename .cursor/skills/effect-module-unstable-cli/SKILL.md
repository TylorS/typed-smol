---
name: effect-module-unstable-cli
description: Guidance for `effect/unstable/cli` focused on APIs like Flag, Param, and Prompt. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/cli

## Owned scope

- Owns only `effect/unstable/cli`.
- Source of truth: `packages/effect/src/unstable/cli/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Flag`
- `Param`
- `Prompt`
- `Command`
- `HelpDoc`
- `Argument`
- `CliError`
- `CliOutput`
- `Primitive`
- Full API list: `references/api-reference.md`

## How to use it

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { cli } from "effect/unstable/cli";

const value = cli.Flag();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-cli-argument` (effect/unstable/cli/Argument)
  - `effect-facet-unstable-cli-clierror` (effect/unstable/cli/CliError)
  - `effect-facet-unstable-cli-clioutput` (effect/unstable/cli/CliOutput)
  - `effect-facet-unstable-cli-command` (effect/unstable/cli/Command)
  - `effect-facet-unstable-cli-flag` (effect/unstable/cli/Flag)
  - `effect-facet-unstable-cli-helpdoc` (effect/unstable/cli/HelpDoc)
  - `effect-facet-unstable-cli-param` (effect/unstable/cli/Param)
  - `effect-facet-unstable-cli-primitive` (effect/unstable/cli/Primitive)
  - `effect-facet-unstable-cli-prompt` (effect/unstable/cli/Prompt)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-cli-argument`.

## Reference anchors

- Module source: `packages/effect/src/unstable/cli/index.ts`
- Representative tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/completions/completions.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Errors.test.ts`
- Representative tests: `packages/effect/test/unstable/cli/Help.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
