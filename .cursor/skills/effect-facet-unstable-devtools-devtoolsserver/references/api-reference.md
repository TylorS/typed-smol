# API Reference: effect/unstable/devtools/DevToolsServer

- Import path: `effect/unstable/devtools/DevToolsServer`
- Source file: `packages/effect/src/unstable/devtools/DevToolsServer.ts`
- Function exports (callable): 1
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `run`

## All Function Signatures

```ts
export declare const run: <_, E, R>(handle: (client: Client) => Effect.Effect<_, E, R>): Effect.Effect<never, SocketServer.SocketServerError, R | SocketServer.SocketServer>;
```

## Other Exports (Non-Function)

- `Client` (interface)
