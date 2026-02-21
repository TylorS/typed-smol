---
name: effect-facet-unstable-eventlog-eventjournal
description: Guidance for facet `effect/unstable/eventlog/EventJournal` focused on APIs like makeMemory, layerMemory, and makeIndexedDb. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/eventlog/EventJournal

## Owned scope

- Owns only `effect/unstable/eventlog/EventJournal`.
- Parent module: `effect/unstable/eventlog`.
- Source anchor: `packages/effect/src/unstable/eventlog/EventJournal.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `makeMemory`
- `layerMemory`
- `makeIndexedDb`
- `layerIndexedDb`
- `makeEntryIdUnsafe`
- `makeRemoteIdUnsafe`
- `Entry`
- `EntryId`
- `RemoteId`
- `RemoteEntry`
- `EventJournal`
- `entryIdMillis`
- `EntryIdTypeId`
- `EventJournalError`
- `RemoteIdTypeId`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { EventJournal } from "effect/unstable/eventlog/EventJournal";

const value = EventJournal.makeMemory();
```

## Common pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-eventlog-event` (effect/unstable/eventlog/Event)
  - `effect-facet-unstable-eventlog-eventgroup` (effect/unstable/eventlog/EventGroup)
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

- Facet source: `packages/effect/src/unstable/eventlog/EventJournal.ts`
- Parent tests: `packages/effect/test/unstable/eventlog/EventJournal.test.ts`
- Parent tests: `packages/effect/test/unstable/eventlog/EventLog.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
