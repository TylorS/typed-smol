---
name: effect-facet-unstable-cli-param
description: Guidance for facet `effect/unstable/cli/Param` focused on APIs like map, Map, and Parse. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/cli/Param

## Owned scope

- Owns only `effect/unstable/cli/Param`.
- Parent module: `effect/unstable/cli`.
- Source anchor: `packages/effect/src/unstable/cli/Param.ts`.

## What it is for

- Param is the polymorphic implementation shared by Argument.ts and Flag.ts. The `Kind` type parameter ("argument" | "flag") enables type-safe separation while sharing parsing logic and combinators.

## API quick reference

- `map`
- `Map`
- `Parse`
- `filter`
- `filterMap`
- `mapEffect`
- `makeSingle`
- `ParsedArgs`
- `mapTryCatch`
- `getParamMetadata`
- `getUnderlyingSingleOrThrow`
- `isParam`
- `isSingle`
- `isFlagParam`
- `Any`
- `date`
- `file`
- `none`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import * as Param from "effect/unstable/cli/Param"

// @internal - this module is not exported publicly

const maybeParam = Param.string(Param.flagKind, "name")

if (Param.isParam(maybeParam)) {
  console.log("This is a Param")
}
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
  - `effect-facet-unstable-cli-primitive` (effect/unstable/cli/Primitive)
  - `effect-facet-unstable-cli-prompt` (effect/unstable/cli/Prompt)
- Parent module ownership belongs to `effect-module-unstable-cli`.

## Escalate to

- `effect-module-unstable-cli` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/cli/Param.ts`
- Parent tests: `packages/effect/test/unstable/cli/Param.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/completions.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Errors.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
