---
name: effect-facet-unstable-reactivity-reactivity
description: Guidance for facet `effect/unstable/reactivity/Reactivity` focused on APIs like make, layer, and query. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/reactivity/Reactivity

## Owned scope

- Owns only `effect/unstable/reactivity/Reactivity`.
- Parent module: `effect/unstable/reactivity`.
- Source anchor: `packages/effect/src/unstable/reactivity/Reactivity.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `make`
- `layer`
- `query`
- `stream`
- `mutation`
- `invalidate`
- `Reactivity`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Reactivity } from "effect/unstable/reactivity/Reactivity"

const value = Reactivity.make()
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-reactivity-asyncresult` (effect/unstable/reactivity/AsyncResult)
  - `effect-facet-unstable-reactivity-atom` (effect/unstable/reactivity/Atom)
  - `effect-facet-unstable-reactivity-atomhttpapi` (effect/unstable/reactivity/AtomHttpApi)
  - `effect-facet-unstable-reactivity-atomref` (effect/unstable/reactivity/AtomRef)
  - `effect-facet-unstable-reactivity-atomregistry` (effect/unstable/reactivity/AtomRegistry)
  - `effect-facet-unstable-reactivity-atomrpc` (effect/unstable/reactivity/AtomRpc)
  - `effect-facet-unstable-reactivity-hydration` (effect/unstable/reactivity/Hydration)
- Parent module ownership belongs to `effect-module-unstable-reactivity`.

## Escalate to

- `effect-module-unstable-reactivity` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/reactivity/Reactivity.ts`
- Parent tests: `packages/effect/test/reactivity/AsyncResult.test.ts`
- Parent tests: `packages/effect/test/reactivity/Atom.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
