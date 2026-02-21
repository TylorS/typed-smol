---
name: effect-module-unstable-rpc
description: Guidance for `effect/unstable/rpc` focused on APIs like Rpc, Utils, and RpcTest. Load after `effect-skill-router` when this module is the primary owner.
---

# Effect Module unstable/rpc

## Owned scope

- Owns only `effect/unstable/rpc`.
- Source of truth: `packages/effect/src/unstable/rpc/index.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `Rpc`
- `Utils`
- `RpcTest`
- `RpcGroup`
- `RpcClient`
- `RpcSchema`
- `RpcServer`
- `RpcWorker`
- `RpcMessage`
- `RpcMiddleware`
- `RpcClientError`
- `RpcSerialization`
- Full API list: `references/api-reference.md`

## How to use it

- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { rpc } from "effect/unstable/rpc"

const value = rpc.Rpc()
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Deep module subsets are owned by these facet skills:
  - `effect-facet-unstable-rpc-rpc` (effect/unstable/rpc/Rpc)
  - `effect-facet-unstable-rpc-rpcclient` (effect/unstable/rpc/RpcClient)
  - `effect-facet-unstable-rpc-rpcclienterror` (effect/unstable/rpc/RpcClientError)
  - `effect-facet-unstable-rpc-rpcgroup` (effect/unstable/rpc/RpcGroup)
  - `effect-facet-unstable-rpc-rpcmessage` (effect/unstable/rpc/RpcMessage)
  - `effect-facet-unstable-rpc-rpcmiddleware` (effect/unstable/rpc/RpcMiddleware)
  - `effect-facet-unstable-rpc-rpcschema` (effect/unstable/rpc/RpcSchema)
  - `effect-facet-unstable-rpc-rpcserialization` (effect/unstable/rpc/RpcSerialization)
  - `effect-facet-unstable-rpc-rpcserver` (effect/unstable/rpc/RpcServer)
  - `effect-facet-unstable-rpc-rpctest` (effect/unstable/rpc/RpcTest)
  - `effect-facet-unstable-rpc-rpcworker` (effect/unstable/rpc/RpcWorker)
  - `effect-facet-unstable-rpc-utils` (effect/unstable/rpc/Utils)

## Escalate to

- `effect-skill-router` for routing and ownership checks.
- First facet entrypoint: `effect-facet-unstable-rpc-rpc`.

## Reference anchors

- Module source: `packages/effect/src/unstable/rpc/index.ts`
- Representative tests: `packages/effect/test/cluster/MessageStorage.test.ts`
- Representative tests: `packages/effect/test/rpc/Rpc.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
