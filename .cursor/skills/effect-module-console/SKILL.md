---
name: effect-module-console
description: Guidance for `effect/Console` focused on APIs like dir, log, and info. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Console

## Owned scope

- Owns only `effect/Console`.
- Source of truth: `packages/effect/src/Console.ts`.

## What it is for

- The `Console` module provides a functional interface for console operations within the Effect ecosystem. It offers type-safe logging, debugging, and console manipulation capabilities with built-in support for testing and environment isolation.

## API quick reference

- `dir`
- `log`
- `info`
- `time`
- `warn`
- `clear`
- `count`
- `debug`
- `error`
- `group`
- `table`
- `trace`
- `assert`
- `dirxml`
- `Console`
- `timeLog`
- `withTime`
- `withGroup`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Console, Effect } from "effect"

// Basic logging
const program = Effect.gen(function*() {
  yield* Console.log("Hello, World!")
  yield* Console.error("Something went wrong")
  yield* Console.warn("This is a warning")
  yield* Console.info("Information message")
})
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Console.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
