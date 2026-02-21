# Usage Reference: effect/unstable/http/Headers

- Import path: `effect/unstable/http/Headers`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Unsafe APIs bypass checks; prefer safe variants unless you control invariants explicitly.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { Headers } from "effect/unstable/http/Headers"

const value = Headers.empty()
const next = Headers.get(value)
```

## Test Anchors

- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`
- `packages/effect/test/unstable/http/UrlParams.test.ts`

## Top Symbols In Anchored Tests

- `get` (11)
- `Headers` (5)
- `fromRecordUnsafe` (2)
- `has` (2)
- `HeadersSchema` (2)
- `empty` (1)
