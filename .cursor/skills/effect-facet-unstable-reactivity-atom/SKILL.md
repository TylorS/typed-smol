---
name: effect-facet-unstable-reactivity-atom
description: Guidance for facet `effect/unstable/reactivity/Atom` focused on APIs like get, map, and set. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/reactivity/Atom

## Owned scope

- Owns only `effect/unstable/reactivity/Atom`.
- Parent module: `effect/unstable/reactivity`.
- Source anchor: `packages/effect/src/unstable/reactivity/Atom.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `get`
- `map`
- `set`
- `make`
- `update`
- `Failure`
- `runtime`
- `setLazy`
- `getResult`
- `mapResult`
- `setIdleTTL`
- `getServerValue`
- `makeRefreshOnSignal`
- `RuntimeFactory`
- `isAtom`
- `isWritable`
- `fn`
- `kvs`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Atom } from "effect/unstable/reactivity/Atom"

const value = Atom.make()
const next = Atom.get(value)
```

## Common pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-reactivity-asyncresult` (effect/unstable/reactivity/AsyncResult)
  - `effect-facet-unstable-reactivity-atomhttpapi` (effect/unstable/reactivity/AtomHttpApi)
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

- Facet source: `packages/effect/src/unstable/reactivity/Atom.ts`
- Parent tests: `packages/effect/test/reactivity/Atom.test.ts`
- Parent tests: `packages/effect/test/reactivity/AsyncResult.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
