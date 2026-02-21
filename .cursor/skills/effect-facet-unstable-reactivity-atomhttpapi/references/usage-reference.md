# Usage Reference: effect/unstable/reactivity/AtomHttpApi

- Import path: `effect/unstable/reactivity/AtomHttpApi`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { AtomHttpApi } from "effect/unstable/reactivity/AtomHttpApi"

const value = AtomHttpApi.Service()
```

## Test Anchors

- `packages/effect/test/reactivity/AsyncResult.test.ts`
- `packages/effect/test/reactivity/Atom.test.ts`

## Top Symbols In Anchored Tests

- `Service` (3)
