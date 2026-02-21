---
name: effect-facet-unstable-eventlog-eventgroup
description: Guidance for facet `effect/unstable/eventlog/EventGroup` focused on APIs like empty, ServicesClient, and ServicesServer. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/eventlog/EventGroup

## Owned scope

- Owns only `effect/unstable/eventlog/EventGroup`.
- Parent module: `effect/unstable/eventlog`.
- Source anchor: `packages/effect/src/unstable/eventlog/EventGroup.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `empty`
- `ServicesClient`
- `ServicesServer`
- `isEventGroup`
- `Any`
- `Events`
- `TypeId`
- `ToService`
- `EventGroup`
- `AnyWithProps`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { EventGroup } from "effect/unstable/eventlog/EventGroup";

const value = EventGroup.empty();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-eventlog-event` (effect/unstable/eventlog/Event)
  - `effect-facet-unstable-eventlog-eventjournal` (effect/unstable/eventlog/EventJournal)
  - `effect-facet-unstable-eventlog-eventlog` (effect/unstable/eventlog/EventLog)
  - `effect-facet-unstable-eventlog-eventlogencryption` (effect/unstable/eventlog/EventLogEncryption)
  - `effect-facet-unstable-eventlog-eventlogremote` (effect/unstable/eventlog/EventLogRemote)
  - `effect-facet-unstable-eventlog-eventlogserver` (effect/unstable/eventlog/EventLogServer)
  - `effect-facet-unstable-eventlog-sqleventlogjournal` (effect/unstable/eventlog/SqlEventLogJournal)
  - `effect-facet-unstable-eventlog-sqleventlogserver` (effect/unstable/eventlog/SqlEventLogServer)
- Parent module ownership belongs to `effect-module-unstable-eventlog`.

## Escalate to

- `effect-module-unstable-eventlog` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/eventlog/EventGroup.ts`
- Parent tests: `packages/effect/test/unstable/eventlog/EventLog.test.ts`
- Parent tests: `packages/effect/test/unstable/eventlog/EventJournal.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
