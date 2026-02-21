# API Reference: effect/Schedule#timing-strategies

- Import path: `effect/Schedule#timing-strategies`
- Source file: `packages/effect/src/Schedule.ts`
- Thematic facet: `timing-strategies`
- Function exports (callable): 9
- Non-function exports: 6

## Purpose

This module provides utilities for creating and composing schedules for retrying operations, repeating effects, and implementing various timing strategies.

## Key Function Exports

- `addDelay`
- `cron`
- `delays`
- `exponential`
- `fixed`
- `jittered`
- `modifyDelay`
- `spaced`
- `windowed`

## All Function Signatures

```ts
export declare const addDelay: <Output, Error2 = never, Env2 = never>(f: (output: Output) => Effect<Duration.Input, Error2, Env2>): <Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 1
export declare const addDelay: <Output, Input, Error, Env, Error2 = never, Env2 = never>(self: Schedule<Output, Input, Error, Env>, f: (output: Output) => Effect<Duration.Input, Error2, Env2>): Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 2
export declare const cron: (expression: Cron.Cron): Schedule<Duration.Duration, unknown, Cron.CronParseError>; // overload 1
export declare const cron: (expression: string, tz?: string | DateTime.TimeZone): Schedule<Duration.Duration, unknown, Cron.CronParseError>; // overload 2
export declare const delays: <Out, In, E, R>(self: Schedule<Out, In, E, R>): Schedule<Duration.Duration, In, E, R>;
export declare const exponential: (base: Duration.Input, factor?: number): Schedule<Duration.Duration>;
export declare const fixed: (interval: Duration.Input): Schedule<number>;
export declare const jittered: <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>): Schedule<Output, Input, Error, Env>;
export declare const modifyDelay: <Output, Error2 = never, Env2 = never>(f: (output: Output, delay: Duration.Duration) => Effect<Duration.Input, Error2, Env2>): <Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 1
export declare const modifyDelay: <Output, Input, Error, Env, Error2 = never, Env2 = never>(self: Schedule<Output, Input, Error, Env>, f: (output: Output, delay: Duration.Input) => Effect<Duration.Input, Error2, Env2>): Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 2
export declare const spaced: (duration: Duration.Input): Schedule<number>;
export declare const windowed: (interval: Duration.Input): Schedule<number>;
```

## Other Exports (Non-Function)

- `CurrentMetadata` (variable)
- `elapsed` (variable)
- `forever` (variable)
- `InputMetadata` (interface)
- `Metadata` (interface)
- `Schedule` (interface)
