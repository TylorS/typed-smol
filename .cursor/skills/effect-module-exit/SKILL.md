---
name: effect-module-exit
description: Guidance for `effect/Exit` focused on APIs like map, fail, and Failure. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Exit

## Owned scope

- Owns only `effect/Exit`.
- Source of truth: `packages/effect/src/Exit.ts`.

## What it is for

- Represents the outcome of an Effect computation as a plain, synchronously inspectable value.

## API quick reference

- `map`
- `fail`
- `Failure`
- `mapBoth`
- `succeed`
- `getCause`
- `mapError`
- `failCause`
- `getSuccess`
- `filterCause`
- `filterValue`
- `filterFailure`
- `filterSuccess`
- `isExit`
- `hasDies`
- `hasFails`
- `isFailure`
- `isSuccess`
- Full API list: `references/api-reference.md`

## How to use it

- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Exit } from "effect"

const success = Exit.succeed(42)
const failure = Exit.fail("not found")

const message = Exit.match(success, {
  onSuccess: (value) => `Got: ${value}`,
  onFailure: () => "Failed"
})
console.log(message) // "Got: 42"
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Exit.ts`
- Representative tests: `packages/effect/test/Exit.test.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/Deferred.test.ts`
- Representative tests: `packages/effect/test/Layer.test.ts`
- Representative tests: `packages/effect/test/RcRef.test.ts`
- Representative tests: `packages/effect/test/Request.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
