# API Reference: effect/unstable/cluster/Reply

- Import path: `effect/unstable/cluster/Reply`
- Source file: `packages/effect/src/unstable/cluster/Reply.ts`
- Function exports (callable): 4
- Non-function exports: 6

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isReply`
- `Reply`
- `serialize`
- `serializeLastReceived`

## All Function Signatures

```ts
export declare const isReply: (u: unknown): u is Reply<Rpc.Any>;
export declare const Reply: <R extends Rpc.Any>(rpc: R): Schema.Codec<WithExit<R> | Chunk<R>, Encoded, Rpc.ServicesServer<R>, Rpc.ServicesClient<R>>;
export declare const serialize: <R extends Rpc.Any>(self: ReplyWithContext<R>): Effect.Effect<Encoded, MalformedMessage>;
export declare const serializeLastReceived: <R extends Rpc.Any>(self: OutgoingRequest<R>): Effect.Effect<Encoded | undefined, MalformedMessage>;
```

## Other Exports (Non-Function)

- `Chunk` (class)
- `ChunkEncoded` (interface)
- `Encoded` (type)
- `ReplyWithContext` (class)
- `WithExit` (class)
- `WithExitEncoded` (interface)
