---
name: effect-facet-unstable-cli-flag
description: Guidance for facet `effect/unstable/cli/Flag` focused on APIs like map, filter, and filterMap. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/cli/Flag

## Owned scope

- Owns only `effect/unstable/cli/Flag`.
- Parent module: `effect/unstable/cli`.
- Source anchor: `packages/effect/src/unstable/cli/Flag.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `map`
- `filter`
- `filterMap`
- `mapEffect`
- `mapTryCatch`
- `date`
- `file`
- `Flag`
- `none`
- `path`
- `float`
- `atMost`
- `choice`
- `orElse`
- `string`
- `atLeast`
- `between`
- `boolean`
- Full API list: `references/api-reference.md`

## How to use it

- Prefer pipe-based composition to keep transformations explicit and testable.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Flag } from "effect/unstable/cli"

const nameFlag = Flag.string("name")
// Usage: --name "John Doe"
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
  - `effect-facet-unstable-cli-helpdoc` (effect/unstable/cli/HelpDoc)
  - `effect-facet-unstable-cli-param` (effect/unstable/cli/Param)
  - `effect-facet-unstable-cli-primitive` (effect/unstable/cli/Primitive)
  - `effect-facet-unstable-cli-prompt` (effect/unstable/cli/Prompt)
- Parent module ownership belongs to `effect-module-unstable-cli`.

## Escalate to

- `effect-module-unstable-cli` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/cli/Flag.ts`
- Parent tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/completions.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Errors.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Help.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
