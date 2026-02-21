---
name: effect-module-requestresolver
description: Guidance for `effect/RequestResolver` focused on APIs like make, makeWith, and setDelay. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module RequestResolver

## Owned scope

- Owns only `effect/RequestResolver`.
- Source of truth: `packages/effect/src/RequestResolver.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `makeWith`
- `setDelay`
- `fromEffect`
- `makeGrouped`
- `fromFunction`
- `fromEffectTagged`
- `fromFunctionBatched`
- `setDelayEffect`
- `isRequestResolver`
- `race`
- `never`
- `around`
- `batchN`
- `asCache`
- `grouped`
- `Variance`
- `withSpan`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { Request } from "effect"
import { Effect, Exit, RequestResolver } from "effect"

interface GetUserRequest extends Request.Request<string, Error> {
  readonly _tag: "GetUserRequest"
  readonly id: number
}

// In practice, you would typically use RequestResolver.make() instead
const resolver = RequestResolver.make<GetUserRequest>((entries) =>
  Effect.sync(() => {
    for (const entry of entries) {
      entry.completeUnsafe(Exit.succeed(`User ${entry.request.id}`))
    }
  })
)
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/RequestResolver.ts`
- Representative tests: `packages/effect/test/Request.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
