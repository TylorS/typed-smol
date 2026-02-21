# API Reference: effect/SchemaParser

- Import path: `effect/SchemaParser`
- Source file: `packages/effect/src/SchemaParser.ts`
- Function exports (callable): 28
- Non-function exports: 1

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `_is`
- `_issue`
- `asOption`
- `asserts`
- `decodeEffect`
- `decodeExit`
- `decodeOption`
- `decodePromise`
- `decodeSync`
- `decodeUnknownEffect`
- `decodeUnknownExit`
- `decodeUnknownOption`
- `decodeUnknownPromise`
- `decodeUnknownSync`
- `encodeEffect`
- `encodeExit`
- `encodeOption`
- `encodePromise`

## All Function Signatures

```ts
export declare const _is: <T>(ast: AST.AST): <I>(input: I) => input is I & T;
export declare const _issue: <T>(ast: AST.AST): (input: unknown, options: AST.ParseOptions) => Issue.Issue | undefined;
export declare const asOption: <T, E, R>(parser: (input: E, options?: AST.ParseOptions) => Effect.Effect<T, Issue.Issue, R>): (input: E, options?: AST.ParseOptions) => Option.Option<T>;
export declare const asserts: <S extends Schema.Top & { readonly DecodingServices: never; }>(schema: S): <I>(input: I) => asserts input is I & S["Type"];
export declare const decodeEffect: <S extends Schema.Top>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => Effect.Effect<S["Type"], Issue.Issue, S["DecodingServices"]>;
export declare const decodeExit: <S extends Schema.Top & { readonly DecodingServices: never; }>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => Exit.Exit<S["Type"], Issue.Issue>;
export declare const decodeOption: <S extends Schema.Top & { readonly DecodingServices: never; }>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => Option.Option<S["Type"]>;
export declare const decodePromise: <S extends Schema.Top & { readonly DecodingServices: never; }>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => Promise<S["Type"]>;
export declare const decodeSync: <S extends Schema.Top & { readonly DecodingServices: never; }>(schema: S): (input: S["Encoded"], options?: AST.ParseOptions) => S["Type"];
export declare const decodeUnknownEffect: <S extends Schema.Top>(schema: S): (input: unknown, options?: AST.ParseOptions) => Effect.Effect<S["Type"], Issue.Issue, S["DecodingServices"]>;
export declare const decodeUnknownExit: <S extends Schema.Top & { readonly DecodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Exit.Exit<S["Type"], Issue.Issue>;
export declare const decodeUnknownOption: <S extends Schema.Top & { readonly DecodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Option.Option<S["Type"]>;
export declare const decodeUnknownPromise: <S extends Schema.Top & { readonly DecodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Promise<S["Type"]>;
export declare const decodeUnknownSync: <S extends Schema.Top & { readonly DecodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => S["Type"];
export declare const encodeEffect: <S extends Schema.Top>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => Effect.Effect<S["Encoded"], Issue.Issue, S["EncodingServices"]>;
export declare const encodeExit: <S extends Schema.Top & { readonly EncodingServices: never; }>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => Exit.Exit<S["Encoded"], Issue.Issue>;
export declare const encodeOption: <S extends Schema.Top & { readonly EncodingServices: never; }>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => Option.Option<S["Encoded"]>;
export declare const encodePromise: <S extends Schema.Top & { readonly EncodingServices: never; }>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => Promise<S["Encoded"]>;
export declare const encodeSync: <S extends Schema.Top & { readonly EncodingServices: never; }>(schema: S): (input: S["Type"], options?: AST.ParseOptions) => S["Encoded"];
export declare const encodeUnknownEffect: <S extends Schema.Top>(schema: S): (input: unknown, options?: AST.ParseOptions) => Effect.Effect<S["Encoded"], Issue.Issue, S["EncodingServices"]>;
export declare const encodeUnknownExit: <S extends Schema.Top & { readonly EncodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Exit.Exit<S["Encoded"], Issue.Issue>;
export declare const encodeUnknownOption: <S extends Schema.Top & { readonly EncodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Option.Option<S["Encoded"]>;
export declare const encodeUnknownPromise: <S extends Schema.Top & { readonly EncodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => Promise<S["Encoded"]>;
export declare const encodeUnknownSync: <S extends Schema.Top & { readonly EncodingServices: never; }>(schema: S): (input: unknown, options?: AST.ParseOptions) => S["Encoded"];
export declare const is: <S extends Schema.Top & { readonly DecodingServices: never; }>(schema: S): <I>(input: I) => input is I & S["Type"];
export declare const makeEffect: <S extends Schema.Top>(schema: S): (input: S["~type.make.in"], options?: Schema.MakeOptions) => Effect.Effect<S["Type"], Issue.Issue>;
export declare const makeUnsafe: <S extends Schema.Top>(schema: S): (input: S["~type.make.in"], options?: Schema.MakeOptions) => S["Type"];
export declare const run: <T, R>(ast: AST.AST): (input: unknown, options?: AST.ParseOptions) => Effect.Effect<T, Issue.Issue, R>;
```

## Other Exports (Non-Function)

- `Parser` (interface)
