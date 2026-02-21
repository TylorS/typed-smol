---
name: effect-module-pull
description: Guidance for `effect/Pull` focused on APIs like Services, filterDone, and filterNoDone. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Pull

## Owned scope

- Owns only `effect/Pull`.
- Source of truth: `packages/effect/src/Pull.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Services`
- `filterDone`
- `filterNoDone`
- `filterDoneLeftover`
- `filterDoneVoid`
- `isDoneCause`
- `isDoneFailure`
- `Pull`
- `Error`
- `Success`
- `Leftover`
- `catchDone`
- `ExcludeDone`
- `matchEffect`
- `doneExitFromCause`
- Full API list: `references/api-reference.md`

## How to use it

- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Cause, Effect, Pull } from "effect"

const pull = Cause.done("stream ended")

const result = Pull.matchEffect(pull, {
  onSuccess: (value) => Effect.succeed(`Got value: ${value}`),
  onFailure: (cause) => Effect.succeed(`Got error: ${cause}`),
  onDone: (leftover) => Effect.succeed(`Stream halted with: ${leftover}`)
})
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Pull.ts`
- Representative tests: `packages/effect/test/Schedule.test.ts`
- Representative tests: `packages/effect/test/SubscriptionRef.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
