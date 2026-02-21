---
name: effect-facet-unstable-devtools-devtoolsclient
description: Guidance for facet `effect/unstable/devtools/DevToolsClient` focused on APIs like make, layer, and makeTracer. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/devtools/DevToolsClient

## Owned scope

- Owns only `effect/unstable/devtools/DevToolsClient`.
- Parent module: `effect/unstable/devtools`.
- Source anchor: `packages/effect/src/unstable/devtools/DevToolsClient.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `layer`
- `makeTracer`
- `layerTracer`
- `DevToolsClient`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { DevToolsClient } from "effect/unstable/devtools/DevToolsClient"

const value = DevToolsClient.make()
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-devtools-devtools` (effect/unstable/devtools/DevTools)
  - `effect-facet-unstable-devtools-devtoolsschema` (effect/unstable/devtools/DevToolsSchema)
  - `effect-facet-unstable-devtools-devtoolsserver` (effect/unstable/devtools/DevToolsServer)
- Parent module ownership belongs to `effect-module-unstable-devtools`.

## Escalate to

- `effect-module-unstable-devtools` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/devtools/DevToolsClient.ts`
- Parent tests: inspect namespace tests under `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
