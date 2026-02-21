# Usage Reference: effect/unstable/http/UrlParams

- Import path: `effect/unstable/http/UrlParams`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { UrlParams } from "effect/unstable/http";
import * as assert from "node:assert";

const urlParams = UrlParams.fromInput({
  a: 1,
  b: true,
  c: "string",
  e: [1, 2, 3],
});
const result = UrlParams.toRecord(urlParams);

assert.deepStrictEqual(result, { a: "1", b: "true", c: "string", e: ["1", "2", "3"] });
```

## Test Anchors

- `packages/effect/test/unstable/http/UrlParams.test.ts`
- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`

## Top Symbols In Anchored Tests

- `UrlParams` (5)
- `make` (4)
- `append` (3)
- `UrlParamsSchema` (2)
- `empty` (1)
- `getAll` (1)
