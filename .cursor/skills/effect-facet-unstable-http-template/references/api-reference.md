# API Reference: effect/unstable/http/Template

- Import path: `effect/unstable/http/Template`
- Source file: `packages/effect/src/unstable/http/Template.ts`
- Function exports (callable): 2
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `make`
- `stream`

## All Function Signatures

```ts
export declare const make: <A extends ReadonlyArray<Interpolated>>(strings: TemplateStringsArray, ...args: A): Effect.Effect<string, Interpolated.Error<A[number]>, Interpolated.Context<A[number]>>;
export declare const stream: <A extends ReadonlyArray<InterpolatedWithStream>>(strings: TemplateStringsArray, ...args: A): Stream.Stream<string, Interpolated.Error<A[number]>, Interpolated.Context<A[number]>>;
```

## Other Exports (Non-Function)

- `Interpolated` (type)
- `InterpolatedWithStream` (type)
- `Primitive` (type)
- `PrimitiveValue` (type)
