# Usage Reference: effect/unstable/httpapi/HttpApiError

- Import path: `effect/unstable/httpapi/HttpApiError`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { HttpApiError } from "effect/unstable/httpapi/HttpApiError"

const value = HttpApiError.ServiceUnavailable()
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
