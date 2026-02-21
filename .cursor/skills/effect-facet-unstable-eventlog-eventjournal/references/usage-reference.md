# Usage Reference: effect/unstable/eventlog/EventJournal

- Import path: `effect/unstable/eventlog/EventJournal`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { EventJournal } from "effect/unstable/eventlog/EventJournal"

const value = EventJournal.makeMemory()
```

## Test Anchors

- `packages/effect/test/unstable/eventlog/EventJournal.test.ts`
- `packages/effect/test/unstable/eventlog/EventLog.test.ts`

## Top Symbols In Anchored Tests

- `EventJournal` (11)
- `layerMemory` (2)
- `Entry` (1)
- `makeEntryIdUnsafe` (1)
