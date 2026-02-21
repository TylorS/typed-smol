# API Reference: effect/Schedule#collecting

- Import path: `effect/Schedule#collecting`
- Source file: `packages/effect/src/Schedule.ts`
- Thematic facet: `collecting`
- Function exports (callable): 5
- Non-function exports: 6

## Purpose

This module provides utilities for creating and composing schedules for retrying operations, repeating effects, and implementing various timing strategies.

## Key Function Exports

- `collectInputs`
- `collectOutputs`
- `collectWhile`
- `reduce`
- `unfold`

## All Function Signatures

```ts
export declare const collectInputs: <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>): Schedule<Array<Input>, Input, Error, Env>;
export declare const collectOutputs: <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>): Schedule<Array<Output>, Input, Error, Env>;
export declare const collectWhile: <Input, Output, Error2 = never, Env2 = never>(predicate: (metadata: Metadata<Output, Input>) => Effect<boolean, Error2, Env2>): <Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Array<Output>, Input, Error | Error2, Env | Env2>; // overload 1
export declare const collectWhile: <Output, Input, Error, Env, Error2 = never, Env2 = never>(self: Schedule<Output, Input, Error, Env>, predicate: (metadata: Metadata<Output, Input>) => Effect<boolean, Error2, Env2>): Schedule<Array<Output>, Input, Error | Error2, Env | Env2>; // overload 2
export declare const reduce: <State, Output, Error2 = never, Env2 = never>(initial: LazyArg<State>, combine: (state: State, output: Output) => Effect<State, Error2, Env2>): <Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<State, Input, Error | Error2, Env | Env2>; // overload 1
export declare const reduce: <Output, Input, Error, Env, State, Error2 = never, Env2 = never>(self: Schedule<Output, Input, Error, Env>, initial: LazyArg<State>, combine: (state: State, output: Output) => Effect<State, Error2, Env2>): Schedule<State, Input, Error | Error2, Env | Env2>; // overload 2
export declare const unfold: <State, Error = never, Env = never>(initial: State, next: (state: State) => Effect<State, Error, Env>): Schedule<State, unknown, Error, Env>;
```

## Other Exports (Non-Function)

- `CurrentMetadata` (variable)
- `elapsed` (variable)
- `forever` (variable)
- `InputMetadata` (interface)
- `Metadata` (interface)
- `Schedule` (interface)
