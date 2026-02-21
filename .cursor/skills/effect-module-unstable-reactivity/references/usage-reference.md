# Usage Reference: effect/unstable/reactivity

- Import path: `effect/unstable/reactivity`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { reactivity } from "effect/unstable/reactivity";

const value = reactivity.Atom();
```

## Test Anchors

- `packages/effect/test/reactivity/AsyncResult.test.ts`
- `packages/effect/test/reactivity/Atom.test.ts`

## Top Symbols In Anchored Tests

- `Atom` (182)
- `AsyncResult` (125)
- `AtomRegistry` (78)
- `Hydration` (3)
- `Reactivity` (1)
