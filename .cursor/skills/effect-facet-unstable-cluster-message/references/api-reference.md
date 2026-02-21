# API Reference: effect/unstable/cluster/Message

- Import path: `effect/unstable/cluster/Message`
- Source file: `packages/effect/src/unstable/cluster/Message.ts`
- Function exports (callable): 5
- Non-function exports: 8

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `deserializeLocal`
- `incomingLocalFromOutgoing`
- `serialize`
- `serializeEnvelope`
- `serializeRequest`

## All Function Signatures

```ts
export declare const deserializeLocal: <Rpc extends Rpc.Any>(self: Outgoing<Rpc>, encoded: Envelope.Partial): Effect.Effect<IncomingLocal<Rpc>, MalformedMessage>;
export declare const incomingLocalFromOutgoing: <R extends Rpc.Any>(self: Outgoing<R>): IncomingLocal<R>;
export declare const serialize: <Rpc extends Rpc.Any>(message: Outgoing<Rpc>): Effect.Effect<Envelope.Partial, MalformedMessage>;
export declare const serializeEnvelope: <Rpc extends Rpc.Any>(message: Outgoing<Rpc>): Effect.Effect<Envelope.Encoded, MalformedMessage, never>;
export declare const serializeRequest: <Rpc extends Rpc.Any>(self: OutgoingRequest<Rpc>): Effect.Effect<Envelope.PartialRequest, MalformedMessage>;
```

## Other Exports (Non-Function)

- `Incoming` (type)
- `IncomingEnvelope` (class)
- `IncomingLocal` (type)
- `IncomingRequest` (class)
- `IncomingRequestLocal` (class)
- `Outgoing` (type)
- `OutgoingEnvelope` (class)
- `OutgoingRequest` (class)
