# API Reference: effect/unstable/persistence/RateLimiter

- Import path: `effect/unstable/persistence/RateLimiter`
- Source file: `packages/effect/src/unstable/persistence/RateLimiter.ts`
- Function exports (callable): 3
- Non-function exports: 14

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `layerStoreRedis`
- `layerStoreRedisConfig`
- `makeStoreRedis`

## All Function Signatures

```ts
export declare const layerStoreRedis: (options?: { readonly prefix?: string | undefined; }): Layer.Layer<RateLimiterStore, never, Redis.Redis>;
export declare const layerStoreRedisConfig: (options: Config.Wrap<{ readonly prefix?: string | undefined; }>): Layer.Layer<RateLimiterStore, Config.ConfigError, Redis.Redis>;
export declare const makeStoreRedis: (options?: { readonly prefix?: string | undefined; } | undefined): Effect.Effect<{ readonly fixedWindow: (options: { readonly key: string; readonly tokens: number; readonly refillRate: Duration.Duration; readonly limit: number | undefined; }) => Effect.Effect<readonly [count: number, ttl: number], RateLimiterError>; readonly tokenBucket: (options: { readonly key: string; readonly tokens: number; readonly limit: number; readonly refillRate: Duration.Duration; readonly allowOverflow: boolean; }) => Effect.Effect<number, RateLimiterError>; }, never, Redis.Redis>;
```

## Other Exports (Non-Function)

- `ConsumeResult` (interface)
- `ErrorTypeId` (type)
- `layer` (variable)
- `layerStoreMemory` (variable)
- `make` (variable)
- `makeSleep` (variable)
- `makeWithRateLimiter` (variable)
- `RateLimiter` (interface)
- `RateLimiterError` (class)
- `RateLimiterErrorReason` (type)
- `RateLimiterStore` (class)
- `RateLimitExceeded` (class)
- `RateLimitStoreError` (class)
- `TypeId` (type)
