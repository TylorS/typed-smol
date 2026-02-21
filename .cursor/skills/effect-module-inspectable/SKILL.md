---
name: effect-module-inspectable
description: Guidance for `effect/Inspectable` focused on APIs like toJson, BaseProto, and Inspectable. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Inspectable

## Owned scope

- Owns only `effect/Inspectable`.
- Source of truth: `packages/effect/src/Inspectable.ts`.

## What it is for

- This module provides utilities for making values inspectable and debuggable in TypeScript.

## API quick reference

- `toJson`
- `BaseProto`
- `Inspectable`
- `NodeInspectSymbol`
- `stringifyCircular`
- `toStringUnknown`
- Full API list: `references/api-reference.md`

## How to use it

- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

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

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Inspectable.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
