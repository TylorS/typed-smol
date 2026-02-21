---
name: effect-facet-unstable-httpapi-httpapisecurity
description: Guidance for facet `effect/unstable/httpapi/HttpApiSecurity` focused on APIs like Type, basic, and Basic. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/httpapi/HttpApiSecurity

## Owned scope

- Owns only `effect/unstable/httpapi/HttpApiSecurity`.
- Parent module: `effect/unstable/httpapi`.
- Source anchor: `packages/effect/src/unstable/httpapi/HttpApiSecurity.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Type`
- `basic`
- `Basic`
- `Proto`
- `apiKey`
- `ApiKey`
- `bearer`
- `Bearer`
- `annotate`
- `Credentials`
- `annotateMerge`
- `HttpApiSecurity`
- Full API list: `references/api-reference.md`

## How to use it

- Prefer pipe-based composition to keep transformations explicit and testable.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.
- Use the reference docs to select the smallest API surface that solves your task.
- Validate behavior against existing tests before introducing new usage patterns.

## Starter example

```ts
import { HttpApiSecurity } from "effect/unstable/httpapi/HttpApiSecurity";

const value = HttpApiSecurity.Type();
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
  - `effect-facet-unstable-httpapi-httpapiswagger` (effect/unstable/httpapi/HttpApiSwagger)
  - `effect-facet-unstable-httpapi-openapi` (effect/unstable/httpapi/OpenApi)
- Parent module ownership belongs to `effect-module-unstable-httpapi`.

## Escalate to

- `effect-module-unstable-httpapi` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/httpapi/HttpApiSecurity.ts`
- Parent tests: inspect namespace tests under `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
