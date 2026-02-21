---
name: effect-facet-unstable-rpc-rpcmiddleware
description: Guidance for facet `effect/unstable/rpc/RpcMiddleware` focused on APIs like Service, Provides, and layerClient. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/rpc/RpcMiddleware

## Owned scope

- Owns only `effect/unstable/rpc/RpcMiddleware`.
- Parent module: `effect/unstable/rpc`.
- Source anchor: `packages/effect/src/unstable/rpc/RpcMiddleware.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Service`
- `Provides`
- `layerClient`
- `ServiceClass`
- `Any`
- `AnyId`
- `Error`
- `TypeId`
- `Requires`
- `ForClient`
- `AnyService`
- `ErrorSchema`
- `SuccessValue`
- `ApplyServices`
- `RpcMiddleware`
- `AnyServiceWithProps`
- `ErrorServicesDecode`
- `ErrorServicesEncode`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { RpcMiddleware } from "effect/unstable/rpc/RpcMiddleware"

const value = RpcMiddleware.Service()
const next = RpcMiddleware.ErrorServicesDecode(value)
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-rpc-rpc` (effect/unstable/rpc/Rpc)
  - `effect-facet-unstable-rpc-rpcclient` (effect/unstable/rpc/RpcClient)
  - `effect-facet-unstable-rpc-rpcclienterror` (effect/unstable/rpc/RpcClientError)
  - `effect-facet-unstable-rpc-rpcgroup` (effect/unstable/rpc/RpcGroup)
  - `effect-facet-unstable-rpc-rpcmessage` (effect/unstable/rpc/RpcMessage)
  - `effect-facet-unstable-rpc-rpcschema` (effect/unstable/rpc/RpcSchema)
  - `effect-facet-unstable-rpc-rpcserialization` (effect/unstable/rpc/RpcSerialization)
  - `effect-facet-unstable-rpc-rpcserver` (effect/unstable/rpc/RpcServer)
  - `effect-facet-unstable-rpc-rpctest` (effect/unstable/rpc/RpcTest)
  - `effect-facet-unstable-rpc-rpcworker` (effect/unstable/rpc/RpcWorker)
  - `effect-facet-unstable-rpc-utils` (effect/unstable/rpc/Utils)
- Parent module ownership belongs to `effect-module-unstable-rpc`.

## Escalate to

- `effect-module-unstable-rpc` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/rpc/RpcMiddleware.ts`
- Parent tests: `packages/effect/test/cluster/MessageStorage.test.ts`
- Parent tests: `packages/effect/test/rpc/Rpc.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
