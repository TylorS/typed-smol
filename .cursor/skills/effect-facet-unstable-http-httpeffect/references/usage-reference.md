# Usage Reference: effect/unstable/http/HttpEffect

- Import path: `effect/unstable/http/HttpEffect`

## What It Is For

Module-specific APIs and usage patterns for Effect programs.

## How To Use

- Start with constructor-style APIs to build values/services before composing operations.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Common Pitfalls

- Scoped resources require deterministic lifecycle management to avoid leaks.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Starter Example

```ts
import { HttpEffect } from "effect/unstable/http/HttpEffect";

const value = HttpEffect.fromWebHandler();
```

## Test Anchors

- `packages/effect/test/unstable/http/HttpEffect.test.ts`
- `packages/effect/test/unstable/http/Cookies.test.ts`
- `packages/effect/test/unstable/http/Headers.test.ts`
- `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- `packages/effect/test/unstable/http/Multipart.test.ts`
- `packages/effect/test/unstable/http/UrlParams.test.ts`

## Top Symbols In Anchored Tests

- `toWebHandler` (13)
- `fromWebHandler` (6)
- `toWebHandlerLayer` (1)
- `toWebHandlerWith` (1)
