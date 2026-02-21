# Usage Reference: effect/unstable/http/HttpBody

- Import path: `effect/unstable/http/HttpBody`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { HttpBody } from "effect/unstable/http/HttpBody";

const value = HttpBody.empty();
```

## Test Anchors

- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`
- `packages/effect/test/unstable/http/UrlParams.test.ts`

## Top Symbols In Anchored Tests

- `Stream` (19)
- `json` (18)
- `text` (11)
- `stream` (10)
- `formData` (6)
- `FormData` (3)
- `empty` (1)
- `file` (1)
- `jsonUnsafe` (1)
