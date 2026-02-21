# Usage Reference: effect/unstable/eventlog/SqlEventLogJournal

- Import path: `effect/unstable/eventlog/SqlEventLogJournal`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { SqlEventLogJournal } from "effect/unstable/eventlog/SqlEventLogJournal";

const value = SqlEventLogJournal.make();
```

## Test Anchors

- `packages/effect/test/unstable/eventlog/EventJournal.test.ts`
- `packages/effect/test/unstable/eventlog/EventLog.test.ts`

## Top Symbols In Anchored Tests

- `layer` (1)
- `make` (1)
