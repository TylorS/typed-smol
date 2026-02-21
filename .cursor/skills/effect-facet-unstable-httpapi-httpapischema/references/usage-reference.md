# Usage Reference: effect/unstable/httpapi/HttpApiSchema

- Import path: `effect/unstable/httpapi/HttpApiSchema`

## What It Is For

HttpApiSchema provides helpers to annotate Effect Schema values with HTTP API metadata (status codes and payload/response encodings) used by the HttpApi builder, client, and OpenAPI generation.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { HttpApiSchema } from "effect/unstable/httpapi/HttpApiSchema"

const value = HttpApiSchema.Empty()
const next = HttpApiSchema.getPayloadEncoding(value)
```

## Test Anchors

- No direct test anchors found; inspect nearby module tests under `packages/effect/test`.

## Top Symbols In Anchored Tests

- No symbol-frequency matches detected in the selected anchor tests.
