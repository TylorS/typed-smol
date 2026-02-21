# Usage Reference: effect/unstable/cluster#proxies

- Import path: `effect/unstable/cluster#proxies`

## What It Is For

entity proxy and resource shims. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `proxies` concern for `effect/unstable/cluster`.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { cluster } from "effect/unstable/cluster"

const value = cluster.EntityProxy()
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/Entity.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
