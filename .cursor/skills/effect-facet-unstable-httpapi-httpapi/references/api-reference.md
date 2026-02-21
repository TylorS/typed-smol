# API Reference: effect/unstable/httpapi/HttpApi

- Import path: `effect/unstable/httpapi/HttpApi`
- Source file: `packages/effect/src/unstable/httpapi/HttpApi.ts`
- Function exports (callable): 3
- Non-function exports: 4

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isHttpApi`
- `make`
- `reflect`

## All Function Signatures

```ts
export declare const isHttpApi: (u: unknown): u is Any;
export declare const make: <const Id extends string>(identifier: Id): HttpApi<Id, never>;
export declare const reflect: <Id extends string, Groups extends HttpApiGroup.Any>(self: HttpApi<Id, Groups>, options: { readonly predicate?: Predicate.Predicate<{ readonly endpoint: HttpApiEndpoint.AnyWithProps; readonly group: HttpApiGroup.AnyWithProps; }> | undefined; readonly onGroup: (options: { readonly group: HttpApiGroup.AnyWithProps; readonly mergedAnnotations: ServiceMap.ServiceMap<never>; }) => void; readonly onEndpoint: (options: { readonly group: HttpApiGroup.AnyWithProps; readonly endpoint: HttpApiEndpoint.AnyWithProps; readonly mergedAnnotations: ServiceMap.ServiceMap<never>; readonly middleware: ReadonlySet<HttpApiMiddleware.AnyKey>; readonly successes: ReadonlyMap<number, readonly [Schema.Top, ...Array<Schema.Top>]>; readonly errors: ReadonlyMap<number, readonly [Schema.Top, ...Array<Schema.Top>]>; }) => void; }): void;
```

## Other Exports (Non-Function)

- `AdditionalSchemas` (class)
- `Any` (interface)
- `AnyWithProps` (type)
- `HttpApi` (interface)
