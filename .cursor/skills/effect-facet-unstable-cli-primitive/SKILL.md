---
name: effect-facet-unstable-cli-primitive
description: Guidance for facet `effect/unstable/cli/Primitive` focused on APIs like getTypeName, getChoiceKeys, and isBoolean. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/cli/Primitive

## Owned scope

- Owns only `effect/unstable/cli/Primitive`.
- Parent module: `effect/unstable/cli`.
- Source anchor: `packages/effect/src/unstable/cli/Primitive.ts`.

## What it is for

- Primitive types for CLI parameter parsing.

## API quick reference

- `getTypeName`
- `getChoiceKeys`
- `isBoolean`
- `isTrueValue`
- `isFalseValue`
- `date`
- `none`
- `path`
- `float`
- `choice`
- `string`
- `boolean`
- `integer`
- `fileText`
- `PathType`
- `redacted`
- `Variance`
- `fileParse`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Effect } from "effect"
import { Primitive } from "effect/unstable/cli"

// Using built-in primitives
const parseString = Effect.gen(function*() {
  const stringResult = yield* Primitive.string.parse("hello")
  const numberResult = yield* Primitive.integer.parse("42")
  const boolResult = yield* Primitive.boolean.parse("true")

  return { stringResult, numberResult, boolResult }
})

// All primitives provide parsing functionality
const parseDate = Effect.gen(function*() {
  const dateResult = yield* Primitive.date.parse("2023-12-25")
  const pathResult = yield* Primitive.path("file", true).parse("./package.json")
  return { dateResult, pathResult }
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
  - `effect-facet-unstable-cli-command` (effect/unstable/cli/Command)
  - `effect-facet-unstable-cli-flag` (effect/unstable/cli/Flag)
  - `effect-facet-unstable-cli-helpdoc` (effect/unstable/cli/HelpDoc)
  - `effect-facet-unstable-cli-param` (effect/unstable/cli/Param)
  - `effect-facet-unstable-cli-prompt` (effect/unstable/cli/Prompt)
- Parent module ownership belongs to `effect-module-unstable-cli`.

## Escalate to

- `effect-module-unstable-cli` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/cli/Primitive.ts`
- Parent tests: `packages/effect/test/unstable/cli/Primitive.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/completions.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Errors.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
