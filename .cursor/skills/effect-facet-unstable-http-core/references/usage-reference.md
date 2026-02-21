# Usage Reference: effect/unstable/http#core

- Import path: `effect/unstable/http#core`

## What It Is For

client and server core APIs. Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Keep work focused on the `core` concern for `effect/unstable/http`.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { http } from "effect/unstable/http";

const value = http.Etag();
```

## Test Anchors

- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`
- `packages/effect/test/unstable/http/UrlParams.test.ts`

## Top Symbols In Anchored Tests

- `HttpEffect` (19)
- `HttpClientRequest` (17)
- `HttpServerResponse` (11)
- `Cookies` (7)
- `Headers` (5)
- `UrlParams` (5)
- `Multipart` (4)
