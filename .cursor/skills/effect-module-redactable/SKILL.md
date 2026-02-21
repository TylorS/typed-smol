---
name: effect-module-redactable
description: Guidance for `effect/Redactable` focused on APIs like getRedacted, isRedactable, and redact. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module Redactable

## Owned scope

- Owns only `effect/Redactable`.
- Source of truth: `packages/effect/src/Redactable.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `getRedacted`
- `isRedactable`
- `redact`
- `Redactable`
- `currentFiberTypeId`
- `symbolRedactable`
- Full API list: `references/api-reference.md`

## How to use it

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import type { ServiceMap } from "effect"
import { Redactable } from "effect"

class SensitiveData implements Redactable.Redactable {
  constructor(private secret: string) {}

  [Redactable.symbolRedactable](context: ServiceMap.ServiceMap<never>) {
    // In production, hide the actual secret
    return { secret: "[REDACTED]" }
  }
}

const data = new SensitiveData("my-secret-key")
// The redacted version will be used when converting to JSON in certain contexts
```

## Common pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Adjacent modules in `effect/*` and `effect/unstable/*` are out of scope for this owner.

## Escalate to

- `effect-skill-router` for routing and ownership checks.

## Reference anchors

- Module source: `packages/effect/src/Redactable.ts`
- Representative tests: `packages/effect/test/Formatter.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
