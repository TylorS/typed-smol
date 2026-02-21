---
name: effect-module-cause
description: Guidance for `effect/Cause` focused on APIs like map, fail, and Fail. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Cause

## Owned scope

- Owns only `effect/Cause`.
- Source of truth: `packages/effect/src/Cause.ts`.

## What it is for

- Structured representation of how an Effect can fail.

## API quick reference

- `map`
- `fail`
- `Fail`
- `empty`
- `fromReasons`
- `makeDieReason`
- `filterInterruptors`
- `makeFailReason`
- `makeInterruptReason`
- `isDone`
- `hasDies`
- `isCause`
- `hasFails`
- `isReason`
- `isDieReason`
- `isFailReason`
- `die`
- `Die`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { Cause, Effect } from "effect"

const program = Effect.gen(function*() {
  const cause = yield* Effect.sandbox(
    Effect.all([
      Effect.fail("err1"),
      Effect.die("defect"),
      Effect.fail("err2")
    ], { concurrency: "unbounded" })
  ).pipe(Effect.flip)

  const errors = cause.reasons
    .filter(Cause.isFailReason)
    .map((r) => r.error)

  const defects = cause.reasons
    .filter(Cause.isDieReason)
    .map((r) => r.defect)

  console.log(errors)  // ["err1", "err2"]  (order may vary)
  console.log(defects) // ["defect"]
})

Effect.runPromise(program)
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Cause.ts`
- Representative tests: `packages/effect/test/Deferred.test.ts`
- Representative tests: `packages/effect/test/Request.test.ts`
- Representative tests: `packages/effect/test/schema/representation/toCodeDocument.test.ts`
- Representative tests: `packages/effect/test/unstable/sql/SqlSchema.test.ts`
- Representative tests: `packages/effect/test/Channel.test.ts`
- Representative tests: `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
