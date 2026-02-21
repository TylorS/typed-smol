---
name: effect-facet-unstable-rpc-rpcmessage
description: Guidance for facet `effect/unstable/rpc/RpcMessage` focused on APIs like FromClient, FromServer, and FromClientEncoded. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/rpc/RpcMessage

## Owned scope

- Owns only `effect/unstable/rpc/RpcMessage`.
- Parent module: `effect/unstable/rpc`.
- Source anchor: `packages/effect/src/unstable/rpc/RpcMessage.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `FromClient`
- `FromServer`
- `FromClientEncoded`
- `FromServerEncoded`
- `Ack`
- `Eof`
- `Ping`
- `Pong`
- `Request`
- `constEof`
- `ClientEnd`
- `constPing`
- `constPong`
- `Interrupt`
- `RequestId`
- `AckEncoded`
- `ResponseId`
- `ExitEncoded`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Use schema/codec APIs to validate inputs at boundaries before business logic.
- Keep runtime/execute APIs at edges; compose pure transformations before execution.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { RpcMessage } from "effect/unstable/rpc/RpcMessage"

const value = RpcMessage.FromClient()
const next = RpcMessage.FromClientEncoded(value)
```

## Common pitfalls

- Concurrency helpers can hide ordering/cancellation behavior; test interruption and race paths.
- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-rpc-rpc` (effect/unstable/rpc/Rpc)
  - `effect-facet-unstable-rpc-rpcclient` (effect/unstable/rpc/RpcClient)
  - `effect-facet-unstable-rpc-rpcclienterror` (effect/unstable/rpc/RpcClientError)
  - `effect-facet-unstable-rpc-rpcgroup` (effect/unstable/rpc/RpcGroup)
  - `effect-facet-unstable-rpc-rpcmiddleware` (effect/unstable/rpc/RpcMiddleware)
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

- Facet source: `packages/effect/src/unstable/rpc/RpcMessage.ts`
- Parent tests: `packages/effect/test/rpc/Rpc.test.ts`
- Parent tests: `packages/effect/test/cluster/MessageStorage.test.ts`
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
