---
name: effect-module-unstable-httpapi
description: Guidance for `effect/unstable/httpapi` focused on APIs like HttpApi, OpenApi, and HttpApiError. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/httpapi

## Owned scope

- Owns only `effect/unstable/httpapi`.
- Source of truth: `packages/effect/src/unstable/httpapi/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `HttpApi`
- `OpenApi`
- `HttpApiError`
- `HttpApiGroup`
- `HttpApiClient`
- `HttpApiScalar`
- `HttpApiSchema`
- `HttpApiBuilder`
- `HttpApiEndpoint`
- `HttpApiMiddleware`
- `HttpApiSecurity`
- `HttpApiSwagger`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { httpapi } from "effect/unstable/httpapi";

const value = httpapi.HttpApi();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-httpapi-httpapi` (effect/unstable/httpapi/HttpApi)
  - `effect-facet-unstable-httpapi-httpapibuilder` (effect/unstable/httpapi/HttpApiBuilder)
  - `effect-facet-unstable-httpapi-httpapiclient` (effect/unstable/httpapi/HttpApiClient)
  - `effect-facet-unstable-httpapi-httpapiendpoint` (effect/unstable/httpapi/HttpApiEndpoint)
  - `effect-facet-unstable-httpapi-httpapierror` (effect/unstable/httpapi/HttpApiError)
  - `effect-facet-unstable-httpapi-httpapigroup` (effect/unstable/httpapi/HttpApiGroup)
  - `effect-facet-unstable-httpapi-httpapimiddleware` (effect/unstable/httpapi/HttpApiMiddleware)
  - `effect-facet-unstable-httpapi-httpapiscalar` (effect/unstable/httpapi/HttpApiScalar)
  - `effect-facet-unstable-httpapi-httpapischema` (effect/unstable/httpapi/HttpApiSchema)
  - `effect-facet-unstable-httpapi-httpapisecurity` (effect/unstable/httpapi/HttpApiSecurity)
  - `effect-facet-unstable-httpapi-httpapiswagger` (effect/unstable/httpapi/HttpApiSwagger)
  - `effect-facet-unstable-httpapi-openapi` (effect/unstable/httpapi/OpenApi)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-httpapi-httpapi`.

## Reference anchors

- Module source: `packages/effect/src/unstable/httpapi/index.ts`
- Representative tests: inspect nearby modules in `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
