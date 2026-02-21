# Usage Reference: effect/unstable/http/HttpClient

- Import path: `effect/unstable/http/HttpClient`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { HttpClient } from "effect/unstable/http/HttpClient";

const value = HttpClient.make();
const next = HttpClient.get(value);
```

## Test Anchors

- `packages/effect/test/HttpClient.test.ts`
- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`

## Top Symbols In Anchored Tests

- `get` (17)
- `HttpClient` (15)
- `post` (3)
- `followRedirects` (2)
- `head` (2)
- `make` (2)
- `catchTag` (1)
- `execute` (1)
- `mapRequest` (1)
