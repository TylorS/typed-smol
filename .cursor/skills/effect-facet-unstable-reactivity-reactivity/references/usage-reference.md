# Usage Reference: effect/unstable/reactivity/Reactivity

- Import path: `effect/unstable/reactivity/Reactivity`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Reactivity } from "effect/unstable/reactivity/Reactivity";

const value = Reactivity.make();
```

## Test Anchors

- `packages/effect/test/reactivity/AsyncResult.test.ts`
- `packages/effect/test/reactivity/Atom.test.ts`

## Top Symbols In Anchored Tests

- `make` (142)
- `stream` (7)
- `layer` (1)
- `mutation` (1)
- `Reactivity` (1)
