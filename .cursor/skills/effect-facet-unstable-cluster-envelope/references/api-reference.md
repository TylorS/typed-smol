# API Reference: effect/unstable/cluster/Envelope

- Import path: `effect/unstable/cluster/Envelope`
- Source file: `packages/effect/src/unstable/cluster/Envelope.ts`
- Function exports (callable): 4
- Non-function exports: 14

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isEnvelope`
- `makeRequest`
- `primaryKey`
- `primaryKeyByAddress`

## All Function Signatures

```ts
export declare const isEnvelope: (u: unknown): u is Envelope<any>;
export declare const makeRequest: <Rpc extends Rpc.Any>(options: { readonly requestId: Snowflake; readonly address: EntityAddress; readonly tag: Rpc.Tag<Rpc>; readonly payload: Rpc.Payload<Rpc>; readonly headers: Headers.Headers; readonly traceId?: string | undefined; readonly spanId?: string | undefined; readonly sampled?: boolean | undefined; }): Request<Rpc>;
export declare const primaryKey: <R extends Rpc.Any>(envelope: Envelope<R>): string | null;
export declare const primaryKeyByAddress: (options: { readonly address: EntityAddress; readonly tag: string; readonly id: string; }): string;
```

## Other Exports (Non-Function)

- `AckChunk` (class)
- `AckChunkEncoded` (interface)
- `Encoded` (type)
- `Envelope` (type)
- `Interrupt` (class)
- `InterruptEncoded` (interface)
- `Partial` (type)
- `PartialArray` (variable)
- `PartialJson` (variable)
- `PartialRequest` (class)
- `PartialRequestEncoded` (interface)
- `Request` (interface)
- `RequestTransform` (variable)
- `TypeId` (variable)
