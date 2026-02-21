# API Reference: effect/Resource

- Import path: `effect/Resource`
- Source file: `packages/effect/src/Resource.ts`
- Function exports (callable): 5
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `auto`
- `get`
- `isResource`
- `manual`
- `refresh`

## All Function Signatures

```ts
export declare const auto: <A, E, R, Out, E2, R2>(acquire: Effect.Effect<A, E, R>, policy: Schedule.Schedule<Out, unknown, E2, R2>): Effect.Effect<Resource<A, E>, never, R | R2 | Scope.Scope>;
export declare const get: <A, E>(self: Resource<A, E>): Effect.Effect<A, E>;
export declare const isResource: (u: unknown): u is Resource<unknown, unknown>;
export declare const manual: <A, E, R>(acquire: Effect.Effect<A, E, R>): Effect.Effect<Resource<A, E>, never, Scope.Scope | R>;
export declare const refresh: <A, E>(self: Resource<A, E>): Effect.Effect<void, E>;
```

## Other Exports (Non-Function)

- `Resource` (interface)
