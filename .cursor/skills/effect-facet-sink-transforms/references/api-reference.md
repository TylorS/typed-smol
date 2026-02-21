# API Reference: effect/Sink#transforms

- Import path: `effect/Sink#transforms`
- Source file: `packages/effect/src/Sink.ts`
- Thematic facet: `transforms`
- Function exports (callable): 12
- Non-function exports: 9

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `flatMap`
- `fromTransform`
- `map`
- `mapEffect`
- `mapEffectEnd`
- `mapEnd`
- `mapError`
- `mapInput`
- `mapInputArray`
- `mapInputArrayEffect`
- `mapInputEffect`
- `mapLeftover`

## All Function Signatures

```ts
export declare const flatMap: <A, A1, L, In1 extends L, L1, E1, R1>(f: (a: A) => Sink<A1, In1, L1, E1, R1>): <In, E, R>(self: Sink<A, In, L, E, R>) => Sink<A1, In & In1, L1 | L, E1 | E, R1 | R>; // overload 1
export declare const flatMap: <A, In, L, E, R, A1, In1 extends L, L1, E1, R1>(self: Sink<A, In, L, E, R>, f: (a: A) => Sink<A1, In1, L1, E1, R1>): Sink<A1, In & In1, L | L1, E | E1, R | R1>; // overload 2
export declare const fromTransform: <In, A, E, R, L = never>(transform: (upstream: Pull.Pull<NonEmptyReadonlyArray<In>, never, void>, scope: Scope.Scope) => Effect.Effect<End<A, L>, E, R>): Sink<A, In, L, E, R>;
export declare const map: <A, A2>(f: (a: A) => A2): <In, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A2, In, L, E, R>; // overload 1
export declare const map: <A, In, L, E, R, A2>(self: Sink<A, In, L, E, R>, f: (a: A) => A2): Sink<A2, In, L, E, R>; // overload 2
export declare const mapEffect: <A, A2, E2, R2>(f: (a: A) => Effect.Effect<A2, E2, R2>): <In, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A2, In, L, E2 | E, R2 | R>; // overload 1
export declare const mapEffect: <A, In, L, E, R, A2, E2, R2>(self: Sink<A, In, L, E, R>, f: (a: A) => Effect.Effect<A2, E2, R2>): Sink<A2, In, L, E | E2, R | R2>; // overload 2
export declare const mapEffectEnd: <A, L, A2, E2, R2, L2 = never>(f: (end: End<A, L>) => Effect.Effect<End<A2, L2>, E2, R2>): <In, E, R>(self: Sink<A, In, L, E, R>) => Sink<A2, In, L2, E2 | E, R2 | R>; // overload 1
export declare const mapEffectEnd: <A, In, L, E, R, A2, E2, R2, L2 = never>(self: Sink<A, In, L, E, R>, f: (end: End<A, L>) => Effect.Effect<End<A2, L2>, E2, R2>): Sink<A2, In, L2, E | E2, R | R2>; // overload 2
export declare const mapEnd: <A, L, A2, L2 = never>(f: (a: End<A, L>) => End<A2, L2>): <In, E, R>(self: Sink<A, In, L, E, R>) => Sink<A2, In, L2, E, R>; // overload 1
export declare const mapEnd: <A, In, L, E, R, A2, L2 = never>(self: Sink<A, In, L, E, R>, f: (a: End<A, L>) => End<A2, L2>): Sink<A2, In, L2, E, R>; // overload 2
export declare const mapError: <E, E2>(f: (error: E) => E2): <A, In, L, R>(self: Sink<A, In, L, E, R>) => Sink<A, In, L, E2, R>; // overload 1
export declare const mapError: <A, In, L, E, R, E2>(self: Sink<A, In, L, E, R>, f: (error: E) => E2): Sink<A, In, L, E2, R>; // overload 2
export declare const mapInput: <In0, In>(f: (input: In0) => In): <A, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In0, L, E, R>; // overload 1
export declare const mapInput: <A, In, L, E, R, In0>(self: Sink<A, In, L, E, R>, f: (input: In0) => In): Sink<A, In0, L, E, R>; // overload 2
export declare const mapInputArray: <In0, In>(f: (input: Arr.NonEmptyReadonlyArray<In0>) => Arr.NonEmptyReadonlyArray<In>): <A, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In0, L, E, R>; // overload 1
export declare const mapInputArray: <A, In, L, E, R, In0>(self: Sink<A, In, L, E, R>, f: (input: Arr.NonEmptyReadonlyArray<In0>) => Arr.NonEmptyReadonlyArray<In>): Sink<A, In0, L, E, R>; // overload 2
export declare const mapInputArrayEffect: <In0, In, E2, R2>(f: (input: Arr.NonEmptyReadonlyArray<In0>) => Effect.Effect<Arr.NonEmptyReadonlyArray<In>, E2, R2>): <A, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In0, L, E2 | E, R2 | R>; // overload 1
export declare const mapInputArrayEffect: <A, In, L, E, R, In0, E2, R2>(self: Sink<A, In, L, E, R>, f: (input: Arr.NonEmptyReadonlyArray<In0>) => Effect.Effect<Arr.NonEmptyReadonlyArray<In>, E2, R2>): Sink<A, In0, L, E | E2, R | R2>; // overload 2
export declare const mapInputEffect: <In0, In, E2, R2>(f: (input: In0) => Effect.Effect<In, E2, R2>): <A, L, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In0, L, E2 | E, R2 | R>; // overload 1
export declare const mapInputEffect: <A, In, L, E, R, In0, E2, R2>(self: Sink<A, In, L, E, R>, f: (input: In0) => Effect.Effect<In, E2, R2>): Sink<A, In0, L, E | E2, R | R2>; // overload 2
export declare const mapLeftover: <L, L2>(f: (leftover: L) => L2): <A, In, E, R>(self: Sink<A, In, L, E, R>) => Sink<A, In, L2, E, R>; // overload 1
export declare const mapLeftover: <A, In, L, E, R, L2>(self: Sink<A, In, L, E, R>, f: (leftover: L) => L2): Sink<A, In, L2, E, R>; // overload 2
```

## Other Exports (Non-Function)

- `count` (variable)
- `drain` (variable)
- `End` (type)
- `never` (variable)
- `Sink` (interface)
- `SinkUnify` (interface)
- `SinkUnifyIgnore` (interface)
- `sum` (variable)
- `timed` (variable)
