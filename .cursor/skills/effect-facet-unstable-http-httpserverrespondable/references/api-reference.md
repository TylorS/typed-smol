# API Reference: effect/unstable/http/HttpServerRespondable

- Import path: `effect/unstable/http/HttpServerRespondable`
- Source file: `packages/effect/src/unstable/http/HttpServerRespondable.ts`
- Function exports (callable): 4
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `isRespondable`
- `toResponse`
- `toResponseOrElse`
- `toResponseOrElseDefect`

## All Function Signatures

```ts
export declare const isRespondable: (u: unknown): u is Respondable;
export declare const toResponse: (self: Respondable): Effect.Effect<HttpServerResponse>;
export declare const toResponseOrElse: (u: unknown, orElse: HttpServerResponse): Effect.Effect<HttpServerResponse>;
export declare const toResponseOrElseDefect: (u: unknown, orElse: HttpServerResponse): Effect.Effect<HttpServerResponse>;
```

## Other Exports (Non-Function)

- `Respondable` (interface)
- `TypeId` (variable)
