---
name: effect-module-unstable-reactivity
description: Guidance for `effect/unstable/reactivity` focused on APIs like Atom, AtomRef, and AtomRpc. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/reactivity

## Owned scope

- Owns only `effect/unstable/reactivity`.
- Source of truth: `packages/effect/src/unstable/reactivity/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Atom`
- `AtomRef`
- `AtomRpc`
- `Hydration`
- `Reactivity`
- `AsyncResult`
- `AtomHttpApi`
- `AtomRegistry`
- Full API list: `references/api-reference.md`

## How to use it

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { reactivity } from "effect/unstable/reactivity"

const value = reactivity.Atom()
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-reactivity-asyncresult` (effect/unstable/reactivity/AsyncResult)
  - `effect-facet-unstable-reactivity-atom` (effect/unstable/reactivity/Atom)
  - `effect-facet-unstable-reactivity-atomhttpapi` (effect/unstable/reactivity/AtomHttpApi)
  - `effect-facet-unstable-reactivity-atomref` (effect/unstable/reactivity/AtomRef)
  - `effect-facet-unstable-reactivity-atomregistry` (effect/unstable/reactivity/AtomRegistry)
  - `effect-facet-unstable-reactivity-atomrpc` (effect/unstable/reactivity/AtomRpc)
  - `effect-facet-unstable-reactivity-hydration` (effect/unstable/reactivity/Hydration)
  - `effect-facet-unstable-reactivity-reactivity` (effect/unstable/reactivity/Reactivity)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-reactivity-asyncresult`.

## Reference anchors

- Module source: `packages/effect/src/unstable/reactivity/index.ts`
- Representative tests: `packages/effect/test/reactivity/AsyncResult.test.ts`
- Representative tests: `packages/effect/test/reactivity/Atom.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
