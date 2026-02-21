# Usage Reference: effect/Redactable

- Import path: `effect/Redactable`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

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

## Test Anchors

- `packages/effect/test/Formatter.test.ts`

## Top Symbols In Anchored Tests

- `Redactable` (4)
- `redact` (2)
- `symbolRedactable` (1)
