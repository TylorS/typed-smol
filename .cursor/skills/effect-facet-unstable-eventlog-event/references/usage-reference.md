# Usage Reference: effect/unstable/eventlog/Event

- Import path: `effect/unstable/eventlog/Event`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Event } from "effect/unstable/eventlog/Event"

const value = Event.make()
```

## Test Anchors

- `packages/effect/test/unstable/eventlog/EventJournal.test.ts`
- `packages/effect/test/unstable/eventlog/EventLog.test.ts`

## Top Symbols In Anchored Tests

- `make` (1)
