---
name: effect-facet-unstable-http-urlparams
description: Guidance for facet `effect/unstable/http/UrlParams` focused on APIs like set, make, and empty. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/http/UrlParams

## Owned scope

- Owns only `effect/unstable/http/UrlParams`.
- Parent module: `effect/unstable/http`.
- Source anchor: `packages/effect/src/unstable/http/UrlParams.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `set`
- `make`
- `empty`
- `getAll`
- `setAll`
- `getLast`
- `makeUrl`
- `getFirst`
- `fromInput`
- `isUrlParams`
- `Input`
- `append`
- `remove`
- `toRecord`
- `toString`
- `appendAll`
- `Coercible`
- `transform`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { UrlParams } from "effect/unstable/http"
import * as assert from "node:assert"

const urlParams = UrlParams.fromInput({
  a: 1,
  b: true,
  c: "string",
  e: [1, 2, 3]
})
const result = UrlParams.toRecord(urlParams)

assert.deepStrictEqual(
  result,
  { "a": "1", "b": "true", "c": "string", "e": ["1", "2", "3"] }
)
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-http-client-impl` (effect/unstable/http#client-impl)
  - `effect-facet-unstable-http-cookies` (effect/unstable/http/Cookies)
  - `effect-facet-unstable-http-core` (effect/unstable/http#core)
  - `effect-facet-unstable-http-etag` (effect/unstable/http/Etag)
  - `effect-facet-unstable-http-fetchhttpclient` (effect/unstable/http/FetchHttpClient)
  - `effect-facet-unstable-http-findmyway` (effect/unstable/http/FindMyWay)
  - `effect-facet-unstable-http-headers` (effect/unstable/http/Headers)
  - `effect-facet-unstable-http-httpbody` (effect/unstable/http/HttpBody)
  - `effect-facet-unstable-http-httpclient` (effect/unstable/http/HttpClient)
  - `effect-facet-unstable-http-httpclienterror` (effect/unstable/http/HttpClientError)
  - `effect-facet-unstable-http-httpclientrequest` (effect/unstable/http/HttpClientRequest)
  - `effect-facet-unstable-http-httpclientresponse` (effect/unstable/http/HttpClientResponse)
  - `effect-facet-unstable-http-httpeffect` (effect/unstable/http/HttpEffect)
  - `effect-facet-unstable-http-httpincomingmessage` (effect/unstable/http/HttpIncomingMessage)
  - plus 16 additional sibling facets.
- Parent module ownership belongs to `effect-module-unstable-http`.

## Escalate to

- `effect-module-unstable-http` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/http/UrlParams.ts`
- Parent tests: `packages/effect/test/unstable/http/UrlParams.test.ts`
- Parent tests: `packages/effect/test/unstable/http/Cookies.test.ts`
- Parent tests: `packages/effect/test/unstable/http/Headers.test.ts`
- Parent tests: `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- Parent tests: `packages/effect/test/unstable/http/HttpEffect.test.ts`
- Parent tests: `packages/effect/test/unstable/http/Multipart.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
