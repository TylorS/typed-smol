# Usage Reference: effect/RequestResolver

- Import path: `effect/RequestResolver`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Request.test.ts`

## Top Symbols In Anchored Tests

- `batchN` (4)
- `fromEffectTagged` (2)
- `grouped` (2)
- `make` (2)
- `RequestResolver` (1)
