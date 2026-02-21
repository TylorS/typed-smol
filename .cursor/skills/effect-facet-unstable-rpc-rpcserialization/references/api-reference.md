# API Reference: effect/unstable/rpc/RpcSerialization

- Import path: `effect/unstable/rpc/RpcSerialization`
- Source file: `packages/effect/src/unstable/rpc/RpcSerialization.ts`
- Function exports (callable): 4
- Non-function exports: 8

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `jsonRpc`
- `layerJsonRpc`
- `layerNdJsonRpc`
- `ndJsonRpc`

## All Function Signatures

```ts
export declare const jsonRpc: (options?: { readonly contentType?: string | undefined; }): RpcSerialization["Service"];
export declare const layerJsonRpc: (options?: { readonly contentType?: string | undefined; }): Layer.Layer<RpcSerialization>;
export declare const layerNdJsonRpc: (options?: { readonly contentType?: string | undefined; }): Layer.Layer<RpcSerialization>;
export declare const ndJsonRpc: (options?: { readonly contentType?: string | undefined; }): RpcSerialization["Service"];
```

## Other Exports (Non-Function)

- `json` (variable)
- `layerJson` (variable)
- `layerMsgPack` (variable)
- `layerNdjson` (variable)
- `msgPack` (variable)
- `ndjson` (variable)
- `Parser` (interface)
- `RpcSerialization` (class)
