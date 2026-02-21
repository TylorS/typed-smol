---
name: effect-module-unstable-devtools
description: Guidance for `effect/unstable/devtools` focused on APIs like DevTools, DevToolsClient, and DevToolsSchema. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/devtools

## Owned scope

- Owns only `effect/unstable/devtools`.
- Source of truth: `packages/effect/src/unstable/devtools/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `DevTools`
- `DevToolsClient`
- `DevToolsSchema`
- `DevToolsServer`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { devtools } from "effect/unstable/devtools"

const value = devtools.DevTools()
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-devtools-devtools` (effect/unstable/devtools/DevTools)
  - `effect-facet-unstable-devtools-devtoolsclient` (effect/unstable/devtools/DevToolsClient)
  - `effect-facet-unstable-devtools-devtoolsschema` (effect/unstable/devtools/DevToolsSchema)
  - `effect-facet-unstable-devtools-devtoolsserver` (effect/unstable/devtools/DevToolsServer)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-devtools-devtools`.

## Reference anchors

- Module source: `packages/effect/src/unstable/devtools/index.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
