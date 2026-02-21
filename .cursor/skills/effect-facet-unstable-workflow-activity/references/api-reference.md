# API Reference: effect/unstable/workflow/Activity

- Import path: `effect/unstable/workflow/Activity`
- Source file: `packages/effect/src/unstable/workflow/Activity.ts`
- Function exports (callable): 4
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `idempotencyKey`
- `make`
- `raceAll`
- `retry`

## All Function Signatures

```ts
export declare const idempotencyKey: (name: string, options?: { readonly includeAttempt?: boolean | undefined; } | undefined): Effect.Effect<string, never, WorkflowInstance>;
export declare const make: <R, Success extends Schema.Top = Schema.Void, Error extends Schema.Top = Schema.Never>(options: { readonly name: string; readonly success?: Success | undefined; readonly error?: Error | undefined; readonly execute: Effect.Effect<Success["Type"], Error["Type"], R>; readonly interruptRetryPolicy?: Schedule.Schedule<any, Cause.Cause<unknown>> | undefined; }): Activity<Success, Error, Exclude<R, WorkflowInstance | WorkflowEngine | Scope>>;
export declare const raceAll: <const Activities extends NonEmptyReadonlyArray<Any>>(name: string, activities: Activities): Effect.Effect<Activities[number] extends Activity<infer _A, infer _E, infer _R> ? _A["Type"] : never, Activities[number] extends Activity<infer _A, infer _E, infer _R> ? _E["Type"] : never, (Activities[number] extends Activity<infer Success, infer Error, infer R> ? Success["DecodingServices"] | Error["DecodingServices"] | R : never) | WorkflowEngine | WorkflowInstance>;
export declare const retry: <E, O extends Types.NoExcessProperties<Omit<Effect.Retry.Options<E>, "schedule">, O>>(options: O): <A, R>(self: Effect.Effect<A, E, R>) => Effect.Retry.Return<R, E, A, O>; // overload 1
export declare const retry: <A, E, R, O extends Types.NoExcessProperties<Omit<Effect.Retry.Options<E>, "schedule">, O>>(self: Effect.Effect<A, E, R>, options: O): Effect.Retry.Return<R, E, A, O>; // overload 2
```

## Other Exports (Non-Function)

- `Activity` (interface)
- `Any` (interface)
- `AnyWithProps` (interface)
- `CurrentAttempt` (variable)
