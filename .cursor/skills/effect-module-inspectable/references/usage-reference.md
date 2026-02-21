# Usage Reference: effect/Inspectable

- Import path: `effect/Inspectable`

## What It Is For

This module provides utilities for making values inspectable and debuggable in TypeScript.

## How To Use

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Inspectable } from "effect";
import { format } from "effect/Formatter";

class User extends Inspectable.Class {
  constructor(
    public readonly name: string,
    public readonly email: string,
  ) {
    super();
  }

  toJSON() {
    return {
      _tag: "User",
      name: this.name,
      email: this.email,
    };
  }
}

const user = new User("Alice", "alice@example.com");
console.log(user.toString()); // Pretty printed JSON
console.log(format(user)); // Same as toString()
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
