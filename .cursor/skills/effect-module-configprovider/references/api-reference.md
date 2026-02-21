# API Reference: effect/ConfigProvider

- Import path: `effect/ConfigProvider`
- Source file: `packages/effect/src/ConfigProvider.ts`
- Function exports (callable): 15
- Non-function exports: 4

## Purpose

Provides the data source layer for the `Config` module. A `ConfigProvider` knows how to load raw configuration nodes from a backing store (environment variables, JSON objects, `.env` files, file trees) and expose them through a uniform `Node` interface that `Config` schemas consume.

## Key Function Exports

- `constantCase`
- `fromDir`
- `fromDotEnv`
- `fromDotEnvContents`
- `fromEnv`
- `fromUnknown`
- `layer`
- `layerAdd`
- `make`
- `makeArray`
- `makeRecord`
- `makeValue`
- `mapInput`
- `nested`
- `orElse`

## All Function Signatures

```ts
export declare const constantCase: (self: ConfigProvider): ConfigProvider;
export declare const fromDir: (options?: { readonly rootPath?: string | undefined; }): Effect.Effect<ConfigProvider, never, Path_.Path | FileSystem.FileSystem>;
export declare const fromDotEnv: (options?: { readonly path?: string | undefined; readonly expandVariables?: boolean | undefined; }): Effect.Effect<ConfigProvider, PlatformError, FileSystem.FileSystem>;
export declare const fromDotEnvContents: (lines: string, options?: { readonly expandVariables?: boolean | undefined; }): ConfigProvider;
export declare const fromEnv: (options?: { readonly env?: Record<string, string> | undefined; }): ConfigProvider;
export declare const fromUnknown: (root: unknown): ConfigProvider;
export declare const layer: <E = never, R = never>(self: ConfigProvider | Effect.Effect<ConfigProvider, E, R>): Layer.Layer<never, E, Exclude<R, Scope>>;
export declare const layerAdd: <E = never, R = never>(self: ConfigProvider | Effect.Effect<ConfigProvider, E, R>, options?: { readonly asPrimary?: boolean | undefined; } | undefined): Layer.Layer<never, E, Exclude<R, Scope>>;
export declare const make: (get: (path: Path) => Effect.Effect<Node | undefined, SourceError>, mapInput?: (path: Path) => Path, prefix?: Path): ConfigProvider;
export declare const makeArray: (length: number, value?: string): Node;
export declare const makeRecord: (keys: ReadonlySet<string>, value?: string): Node;
export declare const makeValue: (value: string): Node;
export declare const mapInput: (f: (path: Path) => Path): (self: ConfigProvider) => ConfigProvider; // overload 1
export declare const mapInput: (self: ConfigProvider, f: (path: Path) => Path): ConfigProvider; // overload 2
export declare const nested: (prefix: string | Path): (self: ConfigProvider) => ConfigProvider; // overload 1
export declare const nested: (self: ConfigProvider, prefix: string | Path): ConfigProvider; // overload 2
export declare const orElse: (that: ConfigProvider): (self: ConfigProvider) => ConfigProvider; // overload 1
export declare const orElse: (self: ConfigProvider, that: ConfigProvider): ConfigProvider; // overload 2
```

## Other Exports (Non-Function)

- `ConfigProvider` (interface)
- `Node` (type)
- `Path` (type)
- `SourceError` (class)
