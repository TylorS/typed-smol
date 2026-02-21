# API Reference: effect/testing/TestClock

- Import path: `effect/testing/TestClock`
- Source file: `packages/effect/src/testing/TestClock.ts`
- Function exports (callable): 6
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `adjust`
- `layer`
- `make`
- `setTime`
- `testClockWith`
- `withLive`

## All Function Signatures

```ts
export declare const adjust: (duration: Duration.Input): Effect.Effect<void>;
export declare const layer: (options?: TestClock.Options): Layer.Layer<TestClock>;
export declare const make: (options?: TestClock.Options | undefined): Effect.Effect<{ currentTimeMillisUnsafe: () => number; currentTimeNanosUnsafe: () => bigint; currentTimeMillis: Effect.Effect<number, never, never>; currentTimeNanos: Effect.Effect<bigint, never, never>; adjust: (duration: Duration.Input) => Effect.Effect<void, never, never>; setTime: (timestamp: number) => Effect.Effect<void, never, never>; sleep: (duration: Duration.Duration) => Effect.Effect<void, never, never>; withLive: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, Exclude<R, never>>; }, never, Scope>;
export declare const setTime: (timestamp: number): Effect.Effect<void>;
export declare const testClockWith: <A, E, R>(f: (testClock: TestClock) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
export declare const withLive: <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
```

## Other Exports (Non-Function)

- `TestClock` (interface)
