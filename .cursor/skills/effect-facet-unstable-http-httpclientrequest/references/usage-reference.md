# Usage Reference: effect/unstable/http/HttpClientRequest

- Import path: `effect/unstable/http/HttpClientRequest`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { HttpClientRequest } from "effect/unstable/http/HttpClientRequest";

const value = HttpClientRequest.make();
const next = HttpClientRequest.get(value);
```

## Test Anchors

- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`
- `packages/effect/test/unstable/http/UrlParams.test.ts`

## Top Symbols In Anchored Tests

- `HttpClientRequest` (17)
- `get` (11)
- `appendUrl` (6)
- `make` (4)
- `bodyFormDataRecord` (3)
- `post` (2)
- `accept` (1)
- `bodyText` (1)
- `empty` (1)
