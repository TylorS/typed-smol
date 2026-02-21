# Usage Reference: effect/unstable/http/HttpServerResponse

- Import path: `effect/unstable/http/HttpServerResponse`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { HttpServerResponse } from "effect/unstable/http/HttpServerResponse";

const value = HttpServerResponse.empty();
const next = HttpServerResponse.setBody(value);
```

## Test Anchors

- `packages/effect/test/unstable/http/HttpServerError.test.ts`
- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`

## Top Symbols In Anchored Tests

- `json` (18)
- `HttpServerResponse` (14)
- `text` (11)
- `stream` (10)
- `formData` (6)
- `empty` (2)
- `setCookieUnsafe` (2)
- `file` (1)
- `fromWeb` (1)
- `jsonUnsafe` (1)
