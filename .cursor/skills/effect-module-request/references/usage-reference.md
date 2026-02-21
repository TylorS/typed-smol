# Usage Reference: effect/Request

- Import path: `effect/Request`

## What It Is For

The `Request` module provides a way to model requests to external data sources in a functional and composable manner. Requests represent descriptions of operations that can be batched, cached, and executed efficiently.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import type { Request } from "effect";

// Define a request that fetches a user by ID
interface GetUser extends Request.Request<string, Error> {
  readonly _tag: "GetUser";
  readonly id: number;
}

// Define a request that fetches all users
interface GetAllUsers extends Request.Request<ReadonlyArray<string>, Error> {
  readonly _tag: "GetAllUsers";
}
```

## Test Anchors

- `packages/effect/test/Request.test.ts`

## Top Symbols In Anchored Tests

- `Request` (11)
- `succeed` (3)
- `complete` (2)
- `fail` (2)
- `of` (2)
- `Class` (1)
- `completeEffect` (1)
- `Entry` (1)
- `tagged` (1)
- `TaggedClass` (1)
