---
name: effect-facet-unstable-reactivity-atomhttpapi
description: Guidance for facet `effect/unstable/reactivity/AtomHttpApi` focused on APIs like Service and AtomHttpApiClient. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/reactivity/AtomHttpApi

## Owned scope

- Owns only `effect/unstable/reactivity/AtomHttpApi`.
- Parent module: `effect/unstable/reactivity`.
- Source anchor: `packages/effect/src/unstable/reactivity/AtomHttpApi.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Service`
- `AtomHttpApiClient`
- Full API list: `references/api-reference.md`

## How to use it

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { AtomHttpApi } from "effect/unstable/reactivity/AtomHttpApi";

const value = AtomHttpApi.Service();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-reactivity-asyncresult` (effect/unstable/reactivity/AsyncResult)
  - `effect-facet-unstable-reactivity-atom` (effect/unstable/reactivity/Atom)
  - `effect-facet-unstable-reactivity-atomref` (effect/unstable/reactivity/AtomRef)
  - `effect-facet-unstable-reactivity-atomregistry` (effect/unstable/reactivity/AtomRegistry)
  - `effect-facet-unstable-reactivity-atomrpc` (effect/unstable/reactivity/AtomRpc)
  - `effect-facet-unstable-reactivity-hydration` (effect/unstable/reactivity/Hydration)
  - `effect-facet-unstable-reactivity-reactivity` (effect/unstable/reactivity/Reactivity)
- Parent module ownership belongs to `effect-module-unstable-reactivity`.

## Escalate to

- `effect-module-unstable-reactivity` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/reactivity/AtomHttpApi.ts`
- Parent tests: `packages/effect/test/reactivity/AsyncResult.test.ts`
- Parent tests: `packages/effect/test/reactivity/Atom.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
