---
name: effect-facet-unstable-http-httpmethod
description: Guidance for facet `effect/unstable/http/HttpMethod` focused on APIs like hasBody, isHttpMethod, and all. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/http/HttpMethod

## Owned scope

- Owns only `effect/unstable/http/HttpMethod`.
- Parent module: `effect/unstable/http`.
- Source anchor: `packages/effect/src/unstable/http/HttpMethod.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `hasBody`
- `isHttpMethod`
- `all`
- `NoBody`
- `allShort`
- `WithBody`
- `HttpMethod`
- Full API list: `references/api-reference.md`

## How to use it

- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { HttpMethod } from "effect/unstable/http"

console.log(HttpMethod.isHttpMethod("GET"))
// true
console.log(HttpMethod.isHttpMethod("get"))
// false
console.log(HttpMethod.isHttpMethod(1))
// false
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

- Facet source: `packages/effect/src/unstable/http/HttpMethod.ts`
- Parent tests: `packages/effect/test/unstable/http/Cookies.test.ts`
- Parent tests: `packages/effect/test/unstable/http/Headers.test.ts`
- Parent tests: `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- Parent tests: `packages/effect/test/unstable/http/HttpEffect.test.ts`
- Parent tests: `packages/effect/test/unstable/http/Multipart.test.ts`
- Parent tests: `packages/effect/test/unstable/http/UrlParams.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
