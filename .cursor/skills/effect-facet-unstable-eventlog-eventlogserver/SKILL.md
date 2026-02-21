---
name: effect-facet-unstable-eventlog-eventlogserver
description: Guidance for facet `effect/unstable/eventlog/EventLogServer` focused on APIs like makeHandler, layerStorageMemory, and makeHandlerHttp. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/eventlog/EventLogServer

## Owned scope

- Owns only `effect/unstable/eventlog/EventLogServer`.
- Parent module: `effect/unstable/eventlog`.
- Source anchor: `packages/effect/src/unstable/eventlog/EventLogServer.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `makeHandler`
- `layerStorageMemory`
- `makeHandlerHttp`
- `makeStorageMemory`
- `Storage`
- `PersistedEntry`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { EventLogServer } from "effect/unstable/eventlog/EventLogServer"

const value = EventLogServer.makeHandler()
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-eventlog-event` (effect/unstable/eventlog/Event)
  - `effect-facet-unstable-eventlog-eventgroup` (effect/unstable/eventlog/EventGroup)
  - `effect-facet-unstable-eventlog-eventjournal` (effect/unstable/eventlog/EventJournal)
  - `effect-facet-unstable-eventlog-eventlog` (effect/unstable/eventlog/EventLog)
  - `effect-facet-unstable-eventlog-eventlogencryption` (effect/unstable/eventlog/EventLogEncryption)
  - `effect-facet-unstable-eventlog-eventlogremote` (effect/unstable/eventlog/EventLogRemote)
  - `effect-facet-unstable-eventlog-sqleventlogjournal` (effect/unstable/eventlog/SqlEventLogJournal)
  - `effect-facet-unstable-eventlog-sqleventlogserver` (effect/unstable/eventlog/SqlEventLogServer)
- Parent module ownership belongs to `effect-module-unstable-eventlog`.

## Escalate to

- `effect-module-unstable-eventlog` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/eventlog/EventLogServer.ts`
- Parent tests: `packages/effect/test/unstable/eventlog/EventJournal.test.ts`
- Parent tests: `packages/effect/test/unstable/eventlog/EventLog.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
