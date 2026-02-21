# API Reference: effect/Schedule

- Import path: `effect/Schedule`
- Source file: `packages/effect/src/Schedule.ts`
- Function exports (callable): 46
- Non-function exports: 6

## Purpose

This module provides utilities for creating and composing schedules for retrying operations, repeating effects, and implementing various timing strategies.

## Key Function Exports

- `addDelay`
- `andThen`
- `andThenResult`
- `both`
- `bothLeft`
- `bothRight`
- `bothWith`
- `collectInputs`
- `collectOutputs`
- `collectWhile`
- `compose`
- `cron`
- `delays`
- `duration`
- `during`
- `either`
- `eitherLeft`
- `eitherRight`

## All Function Signatures

```ts
export declare const addDelay: <Output, Error2 = never, Env2 = never>(f: (output: Output) => Effect<Duration.Input, Error2, Env2>): <Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 1
export declare const addDelay: <Output, Input, Error, Env, Error2 = never, Env2 = never>(self: Schedule<Output, Input, Error, Env>, f: (output: Output) => Effect<Duration.Input, Error2, Env2>): Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 2
export declare const andThen: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output | Output2, Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const andThen: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<Output | Output2, Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const andThenResult: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Result.Result<Output2, Output>, Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const andThenResult: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<Result.Result<Output2, Output>, Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const both: <Output2, Input2, Error2, Env2, Output>(other: Schedule<Output2, Input2, Error2, Env2>): <Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<[Output, Output2], Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const both: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<[Output, Output2], Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const bothLeft: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const bothLeft: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<Output, Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const bothRight: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const bothRight: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<Output, Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const bothWith: <Output2, Input2, Error2, Env2, Output, Output3>(other: Schedule<Output2, Input2, Error2, Env2>, combine: (selfOutput: Output, otherOutput: Output2) => Output3): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output3, Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const bothWith: <Output, Input, Error, Env, Output2, Input2, Error2, Env2, Output3>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>, combine: (selfOutput: Output, otherOutput: Output2) => Output3): Schedule<Output3, Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const collectInputs: <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>): Schedule<Array<Input>, Input, Error, Env>;
export declare const collectOutputs: <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>): Schedule<Array<Output>, Input, Error, Env>;
export declare const collectWhile: <Input, Output, Error2 = never, Env2 = never>(predicate: (metadata: Metadata<Output, Input>) => Effect<boolean, Error2, Env2>): <Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Array<Output>, Input, Error | Error2, Env | Env2>; // overload 1
export declare const collectWhile: <Output, Input, Error, Env, Error2 = never, Env2 = never>(self: Schedule<Output, Input, Error, Env>, predicate: (metadata: Metadata<Output, Input>) => Effect<boolean, Error2, Env2>): Schedule<Array<Output>, Input, Error | Error2, Env | Env2>; // overload 2
export declare const compose: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<[Output, Output2], Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const compose: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<[Output, Output2], Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const cron: (expression: Cron.Cron): Schedule<Duration.Duration, unknown, Cron.CronParseError>; // overload 1
export declare const cron: (expression: string, tz?: string | DateTime.TimeZone): Schedule<Duration.Duration, unknown, Cron.CronParseError>; // overload 2
export declare const delays: <Out, In, E, R>(self: Schedule<Out, In, E, R>): Schedule<Duration.Duration, In, E, R>;
export declare const duration: (durationInput: Duration.Input): Schedule<Duration.Duration>;
export declare const during: (duration: Duration.Input): Schedule<Duration.Duration>;
export declare const either: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<[Output, Output2], Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const either: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<[Output, Output2], Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const eitherLeft: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const eitherLeft: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<Output, Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const eitherRight: <Output2, Input2, Error2, Env2>(other: Schedule<Output2, Input2, Error2, Env2>): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output2, Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const eitherRight: <Output, Input, Error, Env, Output2, Input2, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>): Schedule<Output2, Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const eitherWith: <Output2, Input2, Error2, Env2, Output, Output3>(other: Schedule<Output2, Input2, Error2, Env2>, combine: (selfOutput: Output, otherOutput: Output2) => Output3): <Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output3, Input & Input2, Error | Error2, Env | Env2>; // overload 1
export declare const eitherWith: <Output, Input, Error, Env, Output2, Input2, Error2, Env2, Output3>(self: Schedule<Output, Input, Error, Env>, other: Schedule<Output2, Input2, Error2, Env2>, combine: (selfOutput: Output, otherOutput: Output2) => Output3): Schedule<Output3, Input & Input2, Error | Error2, Env | Env2>; // overload 2
export declare const exponential: (base: Duration.Input, factor?: number): Schedule<Duration.Duration>;
export declare const fibonacci: (one: Duration.Input): Schedule<Duration.Duration>;
export declare const fixed: (interval: Duration.Input): Schedule<number>;
export declare const fromStep: <Input, Output, EnvX, Error, ErrorX, Env>(step: Effect<(now: number, input: Input) => Pull.Pull<[Output, Duration.Duration], ErrorX, Output, EnvX>, Error, Env>): Schedule<Output, Input, Error | Pull.ExcludeDone<ErrorX>, Env | EnvX>;
export declare const fromStepWithMetadata: <Input, Output, EnvX, ErrorX, Error, Env>(step: Effect<(options: InputMetadata<Input>) => Pull.Pull<[Output, Duration.Duration], ErrorX, Output, EnvX>, Error, Env>): Schedule<Output, Input, Error | Pull.ExcludeDone<ErrorX>, Env | EnvX>;
export declare const identity: <A>(): Schedule<A, A>;
export declare const isSchedule: (u: unknown): u is Schedule<unknown, never, unknown, unknown>;
export declare const jittered: <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>): Schedule<Output, Input, Error, Env>;
export declare const map: <Output, Output2, Error2 = never, Env2 = never>(f: (output: Output) => Output2 | Effect<Output2, Error2, Env2>): <Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output2, Input, Error | Error2, Env | Env2>; // overload 1
export declare const map: <Output, Input, Error, Env, Output2, Error2 = never, Env2 = never>(self: Schedule<Output, Input, Error, Env>, f: (output: Output) => Output2 | Effect<Output2, Error2, Env2>): Schedule<Output2, Input, Error | Error2, Env | Env2>; // overload 2
export declare const modifyDelay: <Output, Error2 = never, Env2 = never>(f: (output: Output, delay: Duration.Duration) => Effect<Duration.Input, Error2, Env2>): <Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 1
export declare const modifyDelay: <Output, Input, Error, Env, Error2 = never, Env2 = never>(self: Schedule<Output, Input, Error, Env>, f: (output: Output, delay: Duration.Input) => Effect<Duration.Input, Error2, Env2>): Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 2
export declare const passthrough: <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>): Schedule<Input, Input, Error, Env>;
export declare const recurs: (times: number): Schedule<number>;
export declare const reduce: <State, Output, Error2 = never, Env2 = never>(initial: LazyArg<State>, combine: (state: State, output: Output) => Effect<State, Error2, Env2>): <Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<State, Input, Error | Error2, Env | Env2>; // overload 1
export declare const reduce: <Output, Input, Error, Env, State, Error2 = never, Env2 = never>(self: Schedule<Output, Input, Error, Env>, initial: LazyArg<State>, combine: (state: State, output: Output) => Effect<State, Error2, Env2>): Schedule<State, Input, Error | Error2, Env | Env2>; // overload 2
export declare const satisfiesErrorType: <T>(): <Error extends T, Output = never, Input = unknown, Env = never>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error, Env>;
export declare const satisfiesInputType: <T>(): <Input extends T, Output = never, Error = never, Env = never>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error, Env>;
export declare const satisfiesOutputType: <T>(): <Output extends T, Error = never, Input = unknown, Env = never>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error, Env>;
export declare const satisfiesServicesType: <T>(): <Env extends T, Output = never, Input = unknown, Error = never>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error, Env>;
export declare const spaced: (duration: Duration.Input): Schedule<number>;
export declare const take: (n: number): <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error, Env>; // overload 1
export declare const take: <Output, Input, Error, Env>(self: Schedule<Output, Input, Error, Env>, n: number): Schedule<Output, Input, Error, Env>; // overload 2
export declare const tapInput: <Input, X, Error2, Env2>(f: (input: Input) => Effect<X, Error2, Env2>): <Output, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 1
export declare const tapInput: <Output, Input, Error, Env, X, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, f: (input: Input) => Effect<X, Error2, Env2>): Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 2
export declare const tapOutput: <Output, X, Error2, Env2>(f: (output: Output) => Effect<X, Error2, Env2>): <Input, Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 1
export declare const tapOutput: <Output, Input, Error, Env, X, Error2, Env2>(self: Schedule<Output, Input, Error, Env>, f: (output: Output) => Effect<X, Error2, Env2>): Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 2
export declare const toStep: <Output, Input, Error, Env>(schedule: Schedule<Output, Input, Error, Env>): Effect<(now: number, input: Input) => Pull.Pull<[Output, Duration.Duration], Error, Output, Env>, never, Env>;
export declare const toStepWithMetadata: <Output, Input, Error, Env>(schedule: Schedule<Output, Input, Error, Env>): Effect<(input: Input) => Pull.Pull<Metadata<Output, Input>, Error, Output, Env>, never, Env>;
export declare const toStepWithSleep: <Output, Input, Error, Env>(schedule: Schedule<Output, Input, Error, Env>): Effect<(input: Input) => Pull.Pull<Output, Error, Output, Env>, never, Env>;
export declare const unfold: <State, Error = never, Env = never>(initial: State, next: (state: State) => Effect<State, Error, Env>): Schedule<State, unknown, Error, Env>;
export declare const while: <Input, Output, Error2 = never, Env2 = never>(predicate: (metadata: Metadata<Output, Input>) => Effect<boolean, Error2, Env2>): <Error, Env>(self: Schedule<Output, Input, Error, Env>) => Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 1
export declare const while: <Output, Input, Error, Env, Error2 = never, Env2 = never>(self: Schedule<Output, Input, Error, Env>, predicate: (metadata: Metadata<Output, Input>) => Effect<boolean, Error2, Env2>): Schedule<Output, Input, Error | Error2, Env | Env2>; // overload 2
export declare const windowed: (interval: Duration.Input): Schedule<number>;
```

## Other Exports (Non-Function)

- `CurrentMetadata` (variable)
- `elapsed` (variable)
- `forever` (variable)
- `InputMetadata` (interface)
- `Metadata` (interface)
- `Schedule` (interface)
