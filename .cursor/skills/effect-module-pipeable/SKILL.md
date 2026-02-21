---
name: effect-module-pipeable
description: Guidance for `effect/Pipeable` focused on APIs like Class, Mixin, and Pipeable. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Pipeable

## Owned scope

- Owns only `effect/Pipeable`.
- Source of truth: `packages/effect/src/Pipeable.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Class`
- `Mixin`
- `Pipeable`
- `Prototype`
- `pipeArguments`
- `PipeableConstructor`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Effect } from "effect"

// The Pipeable interface allows Effect values to be chained using the pipe method
const program = Effect.succeed(1).pipe(
  Effect.map((x) => x + 1),
  Effect.flatMap((x) => Effect.succeed(x * 2)),
  Effect.tap((x) => Effect.log(`Result: ${x}`))
)
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Pipeable.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
