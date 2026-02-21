# API Reference: effect/Brand

- Import path: `effect/Brand`
- Source file: `packages/effect/src/Brand.ts`
- Function exports (callable): 4
- Non-function exports: 4

## Purpose

This module provides types and utility functions to create and work with branded types, which are TypeScript types with an added type tag to prevent accidental usage of a value in the wrong context.

## Key Function Exports

- `all`
- `check`
- `make`
- `nominal`

## All Function Signatures

```ts
export declare const all: <Brands extends readonly [Constructor<any>, ...Array<Constructor<any>>]>(...brands: Brand.EnsureCommonBase<Brands>): Constructor<Types.UnionToIntersection<{ [B in keyof Brands]: Brand.FromConstructor<Brands[B]>; }[number]> extends infer X extends Brand<any> ? X : Brand<any>>;
export declare const check: <A extends Brand<any>>(checks_0: AST.Check<Brand<in out Keys extends string>.Unbranded<A>>, ...checks: AST.Check<Brand.Unbranded<A>>[]): Constructor<A>;
export declare const make: <A extends Brand<any>>(filter: (unbranded: Brand.Unbranded<A>) => undefined | boolean | string | Issue.Issue | { readonly path: ReadonlyArray<PropertyKey>; readonly message: string; }): Constructor<A>;
export declare const nominal: <A extends Brand<any>>(): Constructor<A>;
```

## Other Exports (Non-Function)

- `Brand` (interface)
- `Branded` (type)
- `BrandError` (class)
- `Constructor` (interface)
