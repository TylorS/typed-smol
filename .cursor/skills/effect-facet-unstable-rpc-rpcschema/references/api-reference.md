# API Reference: effect/unstable/rpc/RpcSchema

- Import path: `effect/unstable/rpc/RpcSchema`
- Source file: `packages/effect/src/unstable/rpc/RpcSchema.ts`
- Function exports (callable): 3
- Non-function exports: 0

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `getStreamSchemas`
- `isStreamSchema`
- `Stream`

## All Function Signatures

```ts
export declare const getStreamSchemas: (schema: Schema.Top): { readonly success: Schema.Top; readonly error: Schema.Top; } | undefined;
export declare const isStreamSchema: (schema: Schema.Top): schema is Stream<Schema.Top, Schema.Top>;
export declare const Stream: <A extends Schema.Top, E extends Schema.Top>(success: A, error: E): Stream<A, E>;
```

## Other Exports (Non-Function)

- None
