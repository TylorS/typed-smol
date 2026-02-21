# API Reference: effect/unstable/rpc/RpcMessage

- Import path: `effect/unstable/rpc/RpcMessage`
- Source file: `packages/effect/src/unstable/rpc/RpcMessage.ts`
- Function exports (callable): 3
- Non-function exports: 26

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `RequestId`
- `ResponseDefectEncoded`
- `ResponseExitDieEncoded`

## All Function Signatures

```ts
export declare const RequestId: (id: bigint | string): RequestId;
export declare const ResponseDefectEncoded: (input: unknown): ResponseDefectEncoded;
export declare const ResponseExitDieEncoded: (options: { readonly requestId: RequestId; readonly defect: unknown; }): ResponseExitEncoded;
```

## Other Exports (Non-Function)

- `Ack` (interface)
- `AckEncoded` (interface)
- `ClientEnd` (interface)
- `ClientProtocolError` (interface)
- `constEof` (variable)
- `constPing` (variable)
- `constPong` (variable)
- `Eof` (interface)
- `ExitEncoded` (type)
- `FromClient` (type)
- `FromClientEncoded` (type)
- `FromServer` (type)
- `FromServerEncoded` (type)
- `Interrupt` (interface)
- `InterruptEncoded` (interface)
- `Ping` (interface)
- `Pong` (interface)
- `Request` (interface)
- `RequestEncoded` (interface)
- `ResponseChunk` (interface)
- `ResponseChunkEncoded` (interface)
- `ResponseDefect` (interface)
- `ResponseExit` (interface)
- `ResponseExitEncoded` (interface)
- `ResponseId` (type)
- `ResponseIdTypeId` (type)
