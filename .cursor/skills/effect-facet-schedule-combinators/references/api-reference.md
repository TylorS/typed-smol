# API Reference: effect/Schedule#combinators

- Import path: `effect/Schedule#combinators`
- Source file: `packages/effect/src/Schedule.ts`
- Thematic facet: `combinators`
- Function exports (callable): 3
- Non-function exports: 6

## Purpose

This module provides utilities for creating and composing schedules for retrying operations, repeating effects, and implementing various timing strategies.

## Key Function Exports

- `andThen`
- `andThenResult`
- `compose`

## All Function Signatures

```ts
export declare const andThen: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output | Output2, Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const andThen: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<Output | Output2, Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const andThenResult: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Result.Result<Output2, Output>, Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const andThenResult: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<Result.Result<Output2, Output>, Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const compose: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<[Output, Output2], Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const compose: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<[Output, Output2], Input & Input2, Error | Error2, Env | Env2>; // overload 2
```

## Other Exports (Non-Function)

- `CurrentMetadata` (variable)
- `elapsed` (variable)
- `forever` (variable)
- `InputMetadata` (interface)
- `Metadata` (interface)
- `Schedule` (interface)
