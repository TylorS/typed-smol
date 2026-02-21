# Usage Reference: effect/unstable/http/HttpServerError

- Import path: `effect/unstable/http/HttpServerError`

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
import { HttpServerError } from "effect/unstable/http/HttpServerError"

const value = HttpServerError.isHttpServerError()
const next = HttpServerError.RequestParseError(value)
```

## Test Anchors

- `packages/effect/test/unstable/http/HttpServerError.test.ts`
- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`

## Top Symbols In Anchored Tests

- `HttpServerError` (8)
- `isHttpServerError` (6)
- `RouteNotFound` (6)
- `RequestParseError` (5)
- `ResponseError` (5)
- `InternalError` (3)
- `ServeError` (2)
