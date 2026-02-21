# API Reference: effect/unstable/sql/SqlClient

- Import path: `effect/unstable/sql/SqlClient`
- Source file: `packages/effect/src/unstable/sql/SqlClient.ts`
- Function exports (callable): 2
- Non-function exports: 3

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`
- `makeWithTransaction`

## All Function Signatures

```ts
export declare const make: (options: SqlClient.MakeOptions): Effect.Effect<SqlClient, never, Reactivity>;
export declare const makeWithTransaction: <I, S>(options: { readonly transactionService: ServiceMap.Service<I, readonly [conn: S, counter: number]>; readonly spanAttributes: ReadonlyArray<readonly [string, unknown]>; readonly acquireConnection: Effect.Effect<readonly [Scope.Closeable | undefined, S], SqlError>; readonly begin: (conn: NoInfer<S>) => Effect.Effect<void, SqlError>; readonly savepoint: (conn: NoInfer<S>, id: number) => Effect.Effect<void, SqlError>; readonly commit: (conn: NoInfer<S>) => Effect.Effect<void, SqlError>; readonly rollback: (conn: NoInfer<S>) => Effect.Effect<void, SqlError>; readonly rollbackSavepoint: (conn: NoInfer<S>, id: number) => Effect.Effect<void, SqlError>; }): <R, E, A>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E | SqlError, R>;
```

## Other Exports (Non-Function)

- `SafeIntegers` (variable)
- `SqlClient` (interface)
- `TransactionConnection` (class)
