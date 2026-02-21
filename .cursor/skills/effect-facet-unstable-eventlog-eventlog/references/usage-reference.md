# Usage Reference: effect/unstable/eventlog/EventLog

- Import path: `effect/unstable/eventlog/EventLog`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { EventLog } from "effect/unstable/eventlog/EventLog"

const value = EventLog.makeClient()
const next = EventLog.decodeIdentityString(value)
```

## Test Anchors

- `packages/effect/test/unstable/eventlog/EventLog.test.ts`
- `packages/effect/test/unstable/eventlog/EventJournal.test.ts`

## Top Symbols In Anchored Tests

- `EventLog` (11)
- `schema` (4)
- `makeIdentityUnsafe` (2)
- `group` (1)
- `Identity` (1)
- `layer` (1)
