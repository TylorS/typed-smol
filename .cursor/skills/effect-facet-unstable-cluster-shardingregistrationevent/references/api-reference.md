# API Reference: effect/unstable/cluster/ShardingRegistrationEvent

- Import path: `effect/unstable/cluster/ShardingRegistrationEvent`
- Source file: `packages/effect/src/unstable/cluster/ShardingRegistrationEvent.ts`
- Function exports (callable): 3
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `EntityRegistered`
- `match`
- `SingletonRegistered`

## All Function Signatures

```ts
export declare const EntityRegistered: (args: { readonly entity: Entity<any, any>; }): EntityRegistered;
export declare const match: <Cases extends { readonly EntityRegistered: (args: EntityRegistered) => any; readonly SingletonRegistered: (args: SingletonRegistered) => any; }>(cases: Cases): (value: ShardingRegistrationEvent) => Unify<ReturnType<Cases["EntityRegistered" | "SingletonRegistered"]>>; // overload 1
export declare const match: <Cases extends { readonly EntityRegistered: (args: EntityRegistered) => any; readonly SingletonRegistered: (args: SingletonRegistered) => any; }>(value: ShardingRegistrationEvent, cases: Cases): Unify<ReturnType<Cases["EntityRegistered" | "SingletonRegistered"]>>; // overload 2
export declare const SingletonRegistered: (args: { readonly address: SingletonAddress; }): SingletonRegistered;
```

## Other Exports (Non-Function)

- `ShardingRegistrationEvent` (type)
