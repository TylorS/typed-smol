# API Reference: effect/unstable/ai/Toolkit

- Import path: `effect/unstable/ai/Toolkit`
- Source file: `packages/effect/src/unstable/ai/Toolkit.ts`
- Function exports (callable): 2
- Non-function exports: 12

## Purpose

The `Toolkit` module allows for creating and implementing a collection of `Tool`s which can be used to enhance the capabilities of a large language model beyond simple text generation.

## Key Function Exports

- `make`
- `merge`

## All Function Signatures

```ts
export declare const make: <Tools extends ReadonlyArray<Tool.Any>>(...tools: Tools): Toolkit<ToolsByName<Tools>>;
export declare const merge: <const Toolkits extends ReadonlyArray<Any>>(...toolkits: Toolkits): Toolkit<MergedTools<Toolkits>>;
```

## Other Exports (Non-Function)

- `Any` (interface)
- `empty` (variable)
- `HandlerContext` (interface)
- `HandlersFrom` (type)
- `MergedTools` (type)
- `MergeRecords` (type)
- `SimplifyRecord` (type)
- `Toolkit` (interface)
- `Tools` (type)
- `ToolsByName` (type)
- `WithHandler` (interface)
- `WithHandlerTools` (type)
