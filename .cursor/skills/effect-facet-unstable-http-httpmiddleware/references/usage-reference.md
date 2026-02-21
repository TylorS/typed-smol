# Usage Reference: effect/unstable/http/HttpMiddleware

- Import path: `effect/unstable/http/HttpMiddleware`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { HttpMiddleware } from "effect/unstable/http/HttpMiddleware"

const value = HttpMiddleware.make()
const next = HttpMiddleware.searchParamsParser(value)
```

## Test Anchors

- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`
- `packages/effect/test/unstable/http/UrlParams.test.ts`

## Top Symbols In Anchored Tests

- `make` (4)
