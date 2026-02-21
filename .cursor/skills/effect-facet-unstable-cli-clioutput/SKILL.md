---
name: effect-facet-unstable-cli-clioutput
description: Guidance for facet `effect/unstable/cli/CliOutput` focused on APIs like layer, Formatter, and defaultFormatter. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/cli/CliOutput

## Owned scope

- Owns only `effect/unstable/cli/CliOutput`.
- Parent module: `effect/unstable/cli`.
- Source anchor: `packages/effect/src/unstable/cli/CliOutput.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `layer`
- `Formatter`
- `defaultFormatter`
- Full API list: `references/api-reference.md`

## How to use it

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect } from "effect";
import { CliOutput } from "effect/unstable/cli";

// Create a custom formatter implementation
const customFormatter: CliOutput.Formatter = {
  formatHelpDoc: (doc) => `Custom Help: ${doc.usage}`,
  formatCliError: (error) => `Error: ${error.message}`,
  formatError: (error) => `[ERROR] ${error.message}`,
  formatVersion: (name, version) => `${name} (${version})`,
  formatErrors: (errors) => errors.map((error) => error.message).join("\\n"),
};

// Use the custom formatter in a program
const program = Effect.gen(function* () {
  const formatter = yield* CliOutput.Formatter;
  const helpText = formatter.formatVersion("myapp", "1.0.0");
  console.log(helpText);
}).pipe(Effect.provide(CliOutput.layer(customFormatter)));
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-cli-argument` (effect/unstable/cli/Argument)
  - `effect-facet-unstable-cli-clierror` (effect/unstable/cli/CliError)
  - `effect-facet-unstable-cli-command` (effect/unstable/cli/Command)
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

- Facet source: `packages/effect/src/unstable/cli/CliOutput.ts`
- Parent tests: `packages/effect/test/unstable/cli/Arguments.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Command.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/CommandDescriptor.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/completions/completions.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Errors.test.ts`
- Parent tests: `packages/effect/test/unstable/cli/Help.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
