# API Reference: effect/unstable/devtools/DevTools

- Import path: `effect/unstable/devtools/DevTools`
- Source file: `packages/effect/src/unstable/devtools/DevTools.ts`
- Function exports (callable): 2
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layer`
- `layerWebSocket`

## All Function Signatures

```ts
export declare const layer: (url?: string): Layer.Layer<never>;
export declare const layerWebSocket: (url?: string): Layer.Layer<never, never, Socket.WebSocketConstructor>;
```

## Other Exports (Non-Function)

- `layerSocket` (variable)
