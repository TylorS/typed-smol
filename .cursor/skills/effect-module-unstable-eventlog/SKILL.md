---
name: effect-module-unstable-eventlog
description: Guidance for `effect/unstable/eventlog` focused on APIs like Event, EventLog, and EventGroup. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/eventlog

## Owned scope

- Owns only `effect/unstable/eventlog`.
- Source of truth: `packages/effect/src/unstable/eventlog/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Event`
- `EventLog`
- `EventGroup`
- `EventJournal`
- `EventLogEncryption`
- `EventLogRemote`
- `EventLogServer`
- `SqlEventLogJournal`
- `SqlEventLogServer`
- Full API list: `references/api-reference.md`

## How to use it

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { eventlog } from "effect/unstable/eventlog";

const value = eventlog.Event();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-eventlog-event` (effect/unstable/eventlog/Event)
  - `effect-facet-unstable-eventlog-eventgroup` (effect/unstable/eventlog/EventGroup)
  - `effect-facet-unstable-eventlog-eventjournal` (effect/unstable/eventlog/EventJournal)
  - `effect-facet-unstable-eventlog-eventlog` (effect/unstable/eventlog/EventLog)
  - `effect-facet-unstable-eventlog-eventlogencryption` (effect/unstable/eventlog/EventLogEncryption)
  - `effect-facet-unstable-eventlog-eventlogremote` (effect/unstable/eventlog/EventLogRemote)
  - `effect-facet-unstable-eventlog-eventlogserver` (effect/unstable/eventlog/EventLogServer)
  - `effect-facet-unstable-eventlog-sqleventlogjournal` (effect/unstable/eventlog/SqlEventLogJournal)
  - `effect-facet-unstable-eventlog-sqleventlogserver` (effect/unstable/eventlog/SqlEventLogServer)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-eventlog-event`.

## Reference anchors

- Module source: `packages/effect/src/unstable/eventlog/index.ts`
- Representative tests: `packages/effect/test/unstable/eventlog/EventJournal.test.ts`
- Representative tests: `packages/effect/test/unstable/eventlog/EventLog.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
