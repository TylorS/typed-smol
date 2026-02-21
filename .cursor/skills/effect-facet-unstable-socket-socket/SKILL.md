---
name: effect-facet-unstable-socket-socket
description: Guidance for facet `effect/unstable/socket/Socket` focused on APIs like makeChannel, fromWebSocket, and makeWebSocket. Load after `effect-skill-router` when this facet is the primary owner.
---

# Effect Facet unstable/socket/Socket

## Owned scope

- Owns only `effect/unstable/socket/Socket`.
- Parent module: `effect/unstable/socket`.
- Source anchor: `packages/effect/src/unstable/socket/Socket.ts`.

## What it is for

- Module-specific APIs and usage patterns for Effect programs.

## API quick reference

- `makeChannel`
- `fromWebSocket`
- `makeWebSocket`
- `fromTransformStream`
- `layerWebSocket`
- `layerWebSocketConstructorGlobal`
- `makeWebSocketChannel`
- `isSocket`
- `isCloseEvent`
- `isSocketError`
- `Socket`
- `TypeId`
- `toChannel`
- `WebSocket`
- `CloseEvent`
- `SocketError`
- `toChannelMap`
- `toChannelWith`
- Full API list: `references/api-reference.md`

## How to use it

- Start with constructor-style APIs to build values/services before composing operations.
- Prefer pipe-based composition to keep transformations explicit and testable.
- Assume unstable APIs can evolve quickly; isolate usage behind thin local adapters.

## Starter example

```ts
import { Socket } from "effect/unstable/socket/Socket"

const value = Socket.makeChannel()
const next = Socket.toChannelMap(value)
```

## Common pitfalls

- Unstable module contracts may change; avoid coupling core app logic directly to experimental details.
- Prefer explicit, typed combinators over ad-hoc casting or unchecked assumptions.

## Not covered here

- Sibling facets under the same parent are out of scope:
  - `effect-facet-unstable-socket-socketserver` (effect/unstable/socket/SocketServer)
- Parent module ownership belongs to `effect-module-unstable-socket`.

## Escalate to

- `effect-module-unstable-socket` for parent module-wide workflows.
- `effect-skill-router` for cross-module routing and ownership checks.

## Reference anchors

- Facet source: `packages/effect/src/unstable/socket/Socket.ts`
- Parent tests: inspect namespace tests under `packages/effect/test`.
- API details: `references/api-reference.md`
- Usage notes: `references/usage-reference.md`
- Ownership mapping: `references/owner.md`
