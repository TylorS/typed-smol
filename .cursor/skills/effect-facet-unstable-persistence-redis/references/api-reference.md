# API Reference: effect/unstable/persistence/Redis

- Import path: `effect/unstable/persistence/Redis`
- Source file: `packages/effect/src/unstable/persistence/Redis.ts`
- Function exports (callable): 2
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`
- `script`

## All Function Signatures

```ts
export declare const make: (options: { readonly send: <A = unknown>(command: string, ...args: ReadonlyArray<string>) => Effect.Effect<A, RedisError>; }): Effect.Effect<{ readonly send: <A = unknown>(command: string, ...args: ReadonlyArray<string>) => Effect.Effect<A, RedisError>; readonly eval: <Config extends { readonly params: ReadonlyArray<unknown>; readonly result: unknown; }>(script: Script<Config>) => (...params: Config["params"]) => Effect.Effect<Config["result"], RedisError>; }, never, never>;
export declare const script: <Params extends ReadonlyArray<any>>(f: (...params: Params) => ReadonlyArray<unknown>, options: { readonly lua: string; readonly numberOfKeys: number | ((...params: Params) => number); }): Script<{ params: Params; result: void; }>;
```

## Other Exports (Non-Function)

- `Redis` (class)
- `RedisError` (class)
- `Script` (interface)
