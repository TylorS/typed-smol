# Usage Reference: effect/unstable/http#client-impl

- Import path: `effect/unstable/http#client-impl`

## What It Is For

specific client implementation adapters. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `client-impl` concern for `effect/unstable/http`.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { http } from "effect/unstable/http";

const value = http.HttpClient();
```

## Test Anchors

- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`
- `packages/effect/test/unstable/http/UrlParams.test.ts`

## Top Symbols In Anchored Tests

- `HttpClientRequest` (17)
