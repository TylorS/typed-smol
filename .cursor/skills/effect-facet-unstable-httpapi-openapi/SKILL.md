---
name: effect-facet-unstable-httpapi-openapi
description: Guidance for facet `effect/unstable/httpapi/OpenApi` focused on APIs like fromApi, Title, and Format. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/httpapi/OpenApi

## Owned scope

- Owns only `effect/unstable/httpapi/OpenApi`.
- Parent module: `effect/unstable/httpapi`.
- Source anchor: `packages/effect/src/unstable/httpapi/OpenApi.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `fromApi`
- `Title`
- `Format`
- `Exclude`
- `License`
- `Servers`
- `Summary`
- `Version`
- `Override`
- `Transform`
- `Deprecated`
- `Identifier`
- `annotations`
- `Description`
- `OpenAPISpec`
- `ExternalDocs`
- `OpenAPIApiKeySecurityScheme`
- `OpenAPIComponents`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { OpenApi } from "effect/unstable/httpapi/OpenApi";

const value = OpenApi.fromApi();
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
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
- Parent module ownership belongs to `effect-module-unstable-httpapi`.

## Escalate to

- `effect-module-unstable-httpapi` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/httpapi/OpenApi.ts`
- Parent tests: inspect namespace tests under `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
