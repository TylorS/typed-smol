# Usage Reference: effect/unstable/http/Multipart

- Import path: `effect/unstable/http/Multipart`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Starter Example

```ts
import { Multipart } from "effect/unstable/http/Multipart"

const value = Multipart.makeConfig()
```

## Test Anchors

- `packages/effect/test/unstable/http/Multipart.test.ts`
- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/UrlParams.test.ts`

## Top Symbols In Anchored Tests

- `File` (2)
- `makeChannel` (1)
- `PersistedFileSchema` (1)
