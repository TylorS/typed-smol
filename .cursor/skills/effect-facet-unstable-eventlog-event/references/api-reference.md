# API Reference: effect/unstable/eventlog/Event

- Import path: `effect/unstable/eventlog/Event`
- Source file: `packages/effect/src/unstable/eventlog/Event.ts`
- Function exports (callable): 4
- Non-function exports: 25

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `addError`
- `isEvent`
- `make`
- `serviceKey`

## All Function Signatures

```ts
export declare const addError: <A extends Any, Error2 extends Schema.Top>(event: A, error: Error2): AddError<A, Error2>;
export declare const isEvent: (u: unknown): u is Event<any, any, any, any>;
export declare const make: <Tag extends string, Payload extends Schema.Top = Schema.Void, Success extends Schema.Top = Schema.Void, Error extends Schema.Top = Schema.Never>(options: { readonly tag: Tag; readonly primaryKey: (payload: Schema.Schema.Type<Payload>) => string; readonly payload?: Payload | undefined; readonly success?: Success | undefined; readonly error?: Error | undefined; }): Event<Tag, Payload, Success, Error>;
export declare const serviceKey: (tag: string): string;
```

## Other Exports (Non-Function)

- `AddError` (type)
- `Any` (interface)
- `AnyWithProps` (interface)
- `Error` (type)
- `ErrorSchema` (type)
- `ErrorWithTag` (type)
- `Event` (interface)
- `EventHandler` (interface)
- `ExcludeTag` (type)
- `Payload` (type)
- `PayloadSchema` (type)
- `PayloadSchemaWithTag` (type)
- `PayloadWithTag` (type)
- `Services` (type)
- `ServicesClient` (type)
- `ServicesClientWithTag` (type)
- `ServicesServer` (type)
- `Success` (type)
- `SuccessSchema` (type)
- `SuccessWithTag` (type)
- `Tag` (type)
- `TaggedPayload` (type)
- `ToService` (type)
- `TypeId` (type)
- `WithTag` (type)
