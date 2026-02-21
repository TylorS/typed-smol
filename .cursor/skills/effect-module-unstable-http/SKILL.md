---
name: effect-module-unstable-http
description: Guidance for `effect/unstable/http` focused on APIs like Etag, Cookies, and Headers. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/http

## Owned scope

- Owns only `effect/unstable/http`.
- Source of truth: `packages/effect/src/unstable/http/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Etag`
- `Cookies`
- `Headers`
- `HttpBody`
- `Template`
- `FindMyWay`
- `Multipart`
- `UrlParams`
- `HttpClient`
- `HttpEffect`
- `HttpMethod`
- `HttpRouter`
- `HttpServer`
- `Multipasta`
- `HttpPlatform`
- `FetchHttpClient`
- `HttpClientError`
- `HttpClientRequest`
- Full API list: `references/api-reference.md`

## How to use it

- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { http } from "effect/unstable/http";

const value = http.Etag();
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Deep module subsets are owned by these facet skills:
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
  - `effect-facet-unstable-http-httpmethod` (effect/unstable/http/HttpMethod)
  - `effect-facet-unstable-http-httpmiddleware` (effect/unstable/http/HttpMiddleware)
  - `effect-facet-unstable-http-httpplatform` (effect/unstable/http/HttpPlatform)
  - `effect-facet-unstable-http-httprouter` (effect/unstable/http/HttpRouter)
  - `effect-facet-unstable-http-httpserver` (effect/unstable/http/HttpServer)
  - `effect-facet-unstable-http-httpservererror` (effect/unstable/http/HttpServerError)
  - plus 11 additional facets listed in `effect-skill-router` references.

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-http-client-impl`.

## Reference anchors

- Module source: `packages/effect/src/unstable/http/index.ts`
- Representative tests: `packages/effect/test/unstable/http/Cookies.test.ts`
- Representative tests: `packages/effect/test/unstable/http/Headers.test.ts`
- Representative tests: `packages/effect/test/unstable/http/HttpClientRequest.test.ts`
- Representative tests: `packages/effect/test/unstable/http/HttpEffect.test.ts`
- Representative tests: `packages/effect/test/unstable/http/Multipart.test.ts`
- Representative tests: `packages/effect/test/unstable/http/UrlParams.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
