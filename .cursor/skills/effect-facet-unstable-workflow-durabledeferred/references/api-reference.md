# API Reference: effect/unstable/workflow/DurableDeferred

- Import path: `effect/unstable/workflow/DurableDeferred`
- Source file: `packages/effect/src/unstable/workflow/DurableDeferred.ts`
- Function exports (callable): 11
- Non-function exports: 6

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `await`
- `done`
- `fail`
- `failCause`
- `into`
- `make`
- `raceAll`
- `succeed`
- `token`
- `tokenFromExecutionId`
- `tokenFromPayload`

## All Function Signatures

```ts
export declare const await: <Success extends Schema.Top, Error extends Schema.Top>(self: DurableDeferred<Success, Error>): Effect.Effect<Success["Type"], Error["Type"], WorkflowEngine | WorkflowInstance | Success["DecodingServices"] | Error["DecodingServices"]>;
export declare const done: <Success extends Schema.Top, Error extends Schema.Top>(options: { readonly token: Token; readonly exit: Exit.Exit<Success["Type"], Error["Type"]>; }): (self: DurableDeferred<Success, Error>) => Effect.Effect<void, never, WorkflowEngine | Success["EncodingServices"] | Error["EncodingServices"]>; // overload 1
export declare const done: <Success extends Schema.Top, Error extends Schema.Top>(self: DurableDeferred<Success, Error>, options: { readonly token: Token; readonly exit: Exit.Exit<Success["Type"], Error["Type"]>; }): Effect.Effect<void, never, WorkflowEngine | Success["EncodingServices"] | Error["EncodingServices"]>; // overload 2
export declare const fail: <Success extends Schema.Top, Error extends Schema.Top>(options: { readonly token: Token; readonly error: Error["Type"]; }): (self: DurableDeferred<Success, Error>) => Effect.Effect<void, never, WorkflowEngine | Error["EncodingServices"]>; // overload 1
export declare const fail: <Success extends Schema.Top, Error extends Schema.Top>(self: DurableDeferred<Success, Error>, options: { readonly token: Token; readonly error: Error["Type"]; }): Effect.Effect<void, never, WorkflowEngine | Error["EncodingServices"]>; // overload 2
export declare const failCause: <Success extends Schema.Top, Error extends Schema.Top>(options: { readonly token: Token; readonly cause: Cause.Cause<Error["Type"]>; }): (self: DurableDeferred<Success, Error>) => Effect.Effect<void, never, WorkflowEngine | Error["EncodingServices"]>; // overload 1
export declare const failCause: <Success extends Schema.Top, Error extends Schema.Top>(self: DurableDeferred<Success, Error>, options: { readonly token: Token; readonly cause: Cause.Cause<Error["Type"]>; }): Effect.Effect<void, never, WorkflowEngine | Error["EncodingServices"]>; // overload 2
export declare const into: <Success extends Schema.Top, Error extends Schema.Top>(self: DurableDeferred<Success, Error>): <R>(effect: Effect.Effect<Success["Type"], Error["Type"], R>) => Effect.Effect<Success["Type"], Error["Type"], R | WorkflowEngine | WorkflowInstance | Success["DecodingServices"] | Error["DecodingServices"]>; // overload 1
export declare const into: <Success extends Schema.Top, Error extends Schema.Top, R>(effect: Effect.Effect<Success["Type"], Error["Type"], R>, self: DurableDeferred<Success, Error>): Effect.Effect<Success["Type"], Error["Type"], R | WorkflowEngine | WorkflowInstance | Success["DecodingServices"] | Error["DecodingServices"]>; // overload 2
export declare const make: <Success extends Schema.Top = Schema.Void, Error extends Schema.Top = Schema.Never>(name: string, options?: { readonly success?: Success | undefined; readonly error?: Error | undefined; }): DurableDeferred<Success, Error>;
export declare const raceAll: <const Effects extends NonEmptyReadonlyArray<Effect.Effect<any, any, any>>, Success extends Schema.Schema<Effect.Success<Effects[number]>>, Error extends Schema.Schema<Effect.Error<Effects[number]>>>(options: { name: string; success: Success; error: Error; effects: Effects; }): Effect.Effect<Effect.Success<Effects[number]>, Effect.Error<Effects[number]>, Effect.Services<Effects[number]> | Success["DecodingServices"] | Success["EncodingServices"] | Error["DecodingServices"] | Error["EncodingServices"] | WorkflowEngine | WorkflowInstance>;
export declare const succeed: <Success extends Schema.Top, Error extends Schema.Top>(options: { readonly token: Token; readonly value: Success["Type"]; }): (self: DurableDeferred<Success, Error>) => Effect.Effect<void, never, WorkflowEngine | Success["EncodingServices"]>; // overload 1
export declare const succeed: <Success extends Schema.Top, Error extends Schema.Top>(self: DurableDeferred<Success, Error>, options: { readonly token: Token; readonly value: Success["Type"]; }): Effect.Effect<void, never, WorkflowEngine | Success["EncodingServices"]>; // overload 2
export declare const token: <Success extends Schema.Top, Error extends Schema.Top>(self: DurableDeferred<Success, Error>): Effect.Effect<Token, never, WorkflowInstance>;
export declare const tokenFromExecutionId: (options: { readonly workflow: Workflow.Any; readonly executionId: string; }): <Success extends Schema.Top, Error extends Schema.Top>(self: DurableDeferred<Success, Error>) => Token; // overload 1
export declare const tokenFromExecutionId: <Success extends Schema.Top, Error extends Schema.Top>(self: DurableDeferred<Success, Error>, options: { readonly workflow: Workflow.Any; readonly executionId: string; }): Token; // overload 2
export declare const tokenFromPayload: <W extends Workflow.Any>(options: { readonly workflow: W; readonly payload: Workflow.PayloadSchema<W>["~type.make.in"]; }): <Success extends Schema.Top, Error extends Schema.Top>(self: DurableDeferred<Success, Error>) => Effect.Effect<Token>; // overload 1
export declare const tokenFromPayload: <Success extends Schema.Top, Error extends Schema.Top, W extends Workflow.Any>(self: DurableDeferred<Success, Error>, options: { readonly workflow: W; readonly payload: Workflow.PayloadSchema<W>["~type.make.in"]; }): Effect.Effect<Token>; // overload 2
```

## Other Exports (Non-Function)

- `Any` (interface)
- `AnyWithProps` (interface)
- `DurableDeferred` (interface)
- `Token` (type)
- `TokenParsed` (class)
- `TokenTypeId` (type)
