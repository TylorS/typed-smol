# API Reference: effect/Optic

- Import path: `effect/Optic`
- Source file: `packages/effect/src/Optic.ts`
- Function exports (callable): 12
- Non-function exports: 5

## Purpose

Design: "pretty good" persistency. Real updates copy only the path; unrelated branches keep referential identity. No-op updates may still allocate a new root/parents — callers must not rely on identity for no-ops.

## Key Function Exports

- `entries`
- `failure`
- `fromChecks`
- `getAll`
- `id`
- `makeIso`
- `makeLens`
- `makeOptional`
- `makePrism`
- `none`
- `some`
- `success`

## All Function Signatures

```ts
export declare const entries: <A>(): Iso<Record<string, A>, ReadonlyArray<readonly [string, A]>>;
export declare const failure: <A, E>(): Prism<Result.Result<A, E>, E>;
export declare const fromChecks: <T>(checks_0: AST.Check<T>, ...checks: AST.Check<T>[]): Prism<T, T>;
export declare const getAll: <S, A>(traversal: Traversal<S, A>): (s: S) => Array<A>;
export declare const id: <S>(): Iso<S, S>;
export declare const makeIso: <S, A>(get: (s: S) => A, set: (a: A) => S): Iso<S, A>;
export declare const makeLens: <S, A>(get: (s: S) => A, replace: (a: A, s: S) => S): Lens<S, A>;
export declare const makeOptional: <S, A>(getResult: (s: S) => Result.Result<A, string>, set: (a: A, s: S) => Result.Result<S, string>): Optional<S, A>;
export declare const makePrism: <S, A>(getResult: (s: S) => Result.Result<A, string>, set: (a: A) => S): Prism<S, A>;
export declare const none: <A>(): Prism<Option.Option<A>, undefined>;
export declare const some: <A>(): Prism<Option.Option<A>, A>;
export declare const success: <A, E>(): Prism<Result.Result<A, E>, A>;
```

## Other Exports (Non-Function)

- `Iso` (interface)
- `Lens` (interface)
- `Optional` (interface)
- `Prism` (interface)
- `Traversal` (interface)
