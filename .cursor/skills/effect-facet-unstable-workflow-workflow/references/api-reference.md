# API Reference: effect/unstable/workflow/Workflow

- Import path: `effect/unstable/workflow/Workflow`
- Source file: `packages/effect/src/unstable/workflow/Workflow.ts`
- Function exports (callable): 9
- Non-function exports: 16

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `addFinalizer`
- `intoResult`
- `isResult`
- `make`
- `provideScope`
- `Result`
- `suspend`
- `withCompensation`
- `wrapActivityResult`

## All Function Signatures

```ts
export declare const addFinalizer: <R>(f: (exit: Exit.Exit<unknown, unknown>) => Effect.Effect<void, never, R>): Effect.Effect<void, never, WorkflowInstance | R>;
export declare const intoResult: <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<Result<A, E>, never, Exclude<R, Scope.Scope> | WorkflowInstance>;
export declare const isResult: <A = unknown, E = unknown>(u: unknown): u is Result<A, E>;
export declare const make: <const Name extends string, Payload extends Schema.Struct.Fields | AnyStructSchema, Success extends Schema.Top = Schema.Void, Error extends Schema.Top = Schema.Never>(options: { readonly name: Name; readonly payload: Payload; readonly idempotencyKey: (payload: Payload extends Schema.Struct.Fields ? Schema.Struct.Type<Payload> : Payload["Type"]) => string; readonly success?: Success; readonly error?: Error; readonly suspendedRetrySchedule?: Schedule.Schedule<any, unknown> | undefined; readonly annotations?: ServiceMap.ServiceMap<never>; }): Workflow<Name, Payload extends Schema.Struct.Fields ? Schema.Struct<Payload> : Payload, Success, Error>;
export declare const provideScope: <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, Exclude<R, Scope.Scope> | WorkflowInstance>;
export declare const Result: <Success extends Schema.Top, Error extends Schema.Top>(options: { readonly success: Success; readonly error: Error; }): Schema.Union<readonly [CompleteSchema<Success, Error>, typeof Suspended]>;
export declare const suspend: (instance: WorkflowInstance["Service"]): Effect.Effect<never>;
export declare const withCompensation: <A, R2>(compensation: (value: A, cause: Cause.Cause<unknown>) => Effect.Effect<void, never, R2>): <E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R | R2 | WorkflowInstance | Scope.Scope>; // overload 1
export declare const withCompensation: <A, E, R, R2>(effect: Effect.Effect<A, E, R>, compensation: (value: A, cause: Cause.Cause<unknown>) => Effect.Effect<void, never, R2>): Effect.Effect<A, E, R | R2 | WorkflowInstance | Scope.Scope>; // overload 2
export declare const wrapActivityResult: <A, E, R>(effect: Effect.Effect<A, E, R>, isSuspend: (value: A) => boolean): Effect.Effect<A, E, R | WorkflowInstance>;
```

## Other Exports (Non-Function)

- `Any` (interface)
- `AnyStructSchema` (interface)
- `AnyWithProps` (interface)
- `CaptureDefects` (variable)
- `Complete` (class)
- `CompleteEncoded` (interface)
- `CompleteSchema` (interface)
- `Execution` (interface)
- `PayloadSchema` (type)
- `RequirementsClient` (type)
- `RequirementsHandler` (type)
- `ResultEncoded` (type)
- `scope` (variable)
- `Suspended` (class)
- `SuspendOnFailure` (variable)
- `Workflow` (interface)
