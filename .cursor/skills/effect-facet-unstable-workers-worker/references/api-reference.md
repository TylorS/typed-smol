# API Reference: effect/unstable/workers/Worker

- Import path: `effect/unstable/workers/Worker`
- Source file: `packages/effect/src/unstable/workers/Worker.ts`
- Function exports (callable): 3
- Non-function exports: 5

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerSpawner`
- `makePlatform`
- `makeUnsafe`

## All Function Signatures

```ts
export declare const layerSpawner: <W = unknown>(spawner: SpawnerFn<W>): Layer.Layer<Spawner>;
export declare const makePlatform: <W>(): <P extends { readonly postMessage: (message: any, transfers?: any | undefined) => void; }>(options: { readonly setup: (options: { readonly worker: W; readonly scope: Scope.Scope; }) => Effect.Effect<P, WorkerError>; readonly listen: (options: { readonly port: P; readonly emit: (data: any) => void; readonly deferred: Deferred.Deferred<never, WorkerError>; readonly scope: Scope.Scope; }) => Effect.Effect<void>; }) => WorkerPlatform["Service"];
export declare const makeUnsafe: (options: { readonly send: (message: unknown, transfers?: ReadonlyArray<unknown>) => Effect.Effect<void, WorkerError>; readonly run: <A, E, R>(handler: (message: PlatformMessage) => Effect.Effect<A, E, R>) => Effect.Effect<never, E | WorkerError, R>; }): Worker<any, any>;
```

## Other Exports (Non-Function)

- `PlatformMessage` (type)
- `Spawner` (interface)
- `SpawnerFn` (interface)
- `Worker` (interface)
- `WorkerPlatform` (class)
