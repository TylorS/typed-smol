# Usage Reference: effect/unstable/cluster#runners

- Import path: `effect/unstable/cluster#runners`

## What It Is For

runner fleet execution domain. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `runners` concern for `effect/unstable/cluster`.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { cluster } from "effect/unstable/cluster";

const value = cluster.Runner();
const next = cluster.Runners(value);
```

## Test Anchors

- `packages/effect/test/cluster/ClusterWorkflowEngine.test.ts`
- `packages/effect/test/cluster/Entity.test.ts`
- `packages/effect/test/cluster/MessageStorage.test.ts`
- `packages/effect/test/cluster/Sharding.test.ts`

## Top Symbols In Anchored Tests

- `Runners` (9)
- `RunnerHealth` (4)
- `RunnerStorage` (4)
- `EntityAddress` (2)
- `RunnerAddress` (2)
