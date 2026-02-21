# Usage Reference: effect/unstable/eventlog/EventLogRemote

- Import path: `effect/unstable/eventlog/EventLogRemote`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { EventLogRemote } from "effect/unstable/eventlog/EventLogRemote"

const value = EventLogRemote.fromSocket()
const next = EventLogRemote.decodeRequest(value)
```

## Test Anchors

- `packages/effect/test/unstable/eventlog/EventJournal.test.ts`
- `packages/effect/test/unstable/eventlog/EventLog.test.ts`

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
