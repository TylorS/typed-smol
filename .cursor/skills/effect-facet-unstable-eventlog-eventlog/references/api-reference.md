# API Reference: effect/unstable/eventlog/EventLog

- Import path: `effect/unstable/eventlog/EventLog`
- Source file: `packages/effect/src/unstable/eventlog/EventLog.ts`
- Function exports (callable): 10
- Non-function exports: 8

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `decodeIdentityString`
- `encodeIdentityString`
- `group`
- `groupCompaction`
- `groupReactivity`
- `isEventLogSchema`
- `layer`
- `makeClient`
- `makeIdentityUnsafe`
- `schema`

## All Function Signatures

```ts
export declare const decodeIdentityString: (value: string): Identity["Service"];
export declare const encodeIdentityString: (identity: Identity["Service"]): string;
export declare const group: <Events extends Event.Any, Return>(group: EventGroup.EventGroup<Events>, f: (handlers: Handlers<never, Events>) => Handlers.ValidateReturn<Return>): Layer.Layer<Event.ToService<Events>, Handlers.Error<Return>, Exclude<Handlers.Services<Return>, Scope.Scope>>;
export declare const groupCompaction: <Events extends Event.Any, R>(group: EventGroup.EventGroup<Events>, effect: (options: { readonly primaryKey: string; readonly entries: ReadonlyArray<Entry>; readonly events: ReadonlyArray<Event.TaggedPayload<Events>>; readonly write: <Tag extends Event.Tag<Events>>(tag: Tag, payload: Event.PayloadWithTag<Events, Tag>) => Effect.Effect<void, never, Event.PayloadSchemaWithTag<Events, Tag>["EncodingServices"]>; }) => Effect.Effect<void, never, R>): Layer.Layer<never, never, Identity | EventJournal | R | Event.PayloadSchema<Events>["DecodingServices"]>;
export declare const groupReactivity: <Events extends Event.Any>(group: EventGroup.EventGroup<Events>, keys: { readonly [Tag in Event.Tag<Events>]?: ReadonlyArray<string>; } | ReadonlyArray<string>): Layer.Layer<never, never, Identity | EventJournal>;
export declare const isEventLogSchema: (u: unknown): u is EventLogSchema<EventGroup.Any>;
export declare const layer: <Groups extends EventGroup.Any>(_schema: EventLogSchema<Groups>): Layer.Layer<EventLog, never, EventGroup.ToService<Groups> | EventJournal | Identity>;
export declare const makeClient: <Groups extends EventGroup.Any>(schema: EventLogSchema<Groups>): Effect.Effect<(<Tag extends Event.Tag<EventGroup.Events<Groups>>>(event: Tag, payload: Event.PayloadWithTag<EventGroup.Events<Groups>, Tag>) => Effect.Effect<Event.SuccessWithTag<EventGroup.Events<Groups>, Tag>, Event.ErrorWithTag<EventGroup.Events<Groups>, Tag> | EventJournalError>), never, EventLog>;
export declare const makeIdentityUnsafe: (): Identity["Service"];
export declare const schema: <Groups extends ReadonlyArray<EventGroup.Any>>(...groups: Groups): EventLogSchema<Groups[number]>;
```

## Other Exports (Non-Function)

- `EventLog` (class)
- `EventLogSchema` (interface)
- `Handlers` (interface)
- `HandlersTypeId` (type)
- `Identity` (class)
- `IdentitySchema` (variable)
- `layerEventLog` (variable)
- `SchemaTypeId` (type)
