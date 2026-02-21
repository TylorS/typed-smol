---
name: effect-facet-unstable-httpapi-httpapibuilder
description: Guidance for facet `effect/unstable/httpapi/HttpApiBuilder` focused on APIs like layer, FromGroup, and Any. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/httpapi/HttpApiBuilder

## Owned scope

- Owns only `effect/unstable/httpapi/HttpApiBuilder`.
- Parent module: `effect/unstable/httpapi`.
- Source anchor: `packages/effect/src/unstable/httpapi/HttpApiBuilder.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `layer`
- `FromGroup`
- `Any`
- `Item`
- `Error`
- `group`
- `Context`
- `Handlers`
- `HandlersTypeId`
- `securityDecode`
- `securitySetCookie`
- `ValidateReturn`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Treat stateful APIs as synchronization boundaries and keep updates atomic.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { HttpApiBuilder } from "effect/unstable/httpapi/HttpApiBuilder"

const value = HttpApiBuilder.FromGroup()
const next = HttpApiBuilder.securityDecode(value)
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-httpapi-httpapi` (effect/unstable/httpapi/HttpApi)
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
- Parent module ownership belongs to `effect-module-unstable-httpapi`.

## Escalate to

- `effect-module-unstable-httpapi` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/httpapi/HttpApiBuilder.ts`
- Parent tests: inspect namespace tests under `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
