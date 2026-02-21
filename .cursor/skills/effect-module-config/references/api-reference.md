# API Reference: effect/Config

- Import path: `effect/Config`
- Source file: `packages/effect/src/Config.ts`
- Function exports (callable): 26
- Non-function exports: 9

## Purpose

Declarative, schema-driven configuration loading. A `Config<T>` describes how to read and validate a value of type `T` from a `ConfigProvider`. Configs can be composed, transformed, and used directly as Effects.

## Key Function Exports

- `all`
- `boolean`
- `date`
- `duration`
- `fail`
- `finite`
- `int`
- `isConfig`
- `literal`
- `logLevel`
- `make`
- `map`
- `mapOrFail`
- `nonEmptyString`
- `number`
- `option`
- `orElse`
- `port`

## All Function Signatures

```ts
export declare const all: <const Arg extends Iterable<Config<any>> | Record<string, Config<any>>>(arg: Arg): Config<[Arg] extends [ReadonlyArray<Config<any>>] ? { -readonly [K in keyof Arg]: [Arg[K]] extends [Config<infer A>] ? A : never; } : [Arg] extends [Iterable<Config<infer A>>] ? Array<A> : [Arg] extends [Record<string, Config<any>>] ? { -readonly [K in keyof Arg]: [Arg[K]] extends [Config<infer A>] ? A : never; } : never>;
export declare const boolean: (name?: string): Config<boolean>;
export declare const date: (name?: string): Config<Date>;
export declare const duration: (name?: string): Config<Duration_.Duration>;
export declare const fail: (err: SourceError | Schema.SchemaError): Config<never>;
export declare const finite: (name?: string): Config<number>;
export declare const int: (name?: string): Config<number>;
export declare const isConfig: (u: unknown): u is Config<unknown>;
export declare const literal: <L extends AST.LiteralValue>(literal: L, name?: string): Config<L>;
export declare const logLevel: (name?: string): Config<LogLevel_.LogLevel>;
export declare const make: <T>(parse: (provider: ConfigProvider.ConfigProvider) => Effect.Effect<T, ConfigError>): Config<T>;
export declare const map: <A, B>(f: (a: A) => B): (self: Config<A>) => Config<B>; // overload 1
export declare const map: <A, B>(self: Config<A>, f: (a: A) => B): Config<B>; // overload 2
export declare const mapOrFail: <A, B>(f: (a: A) => Effect.Effect<B, ConfigError>): (self: Config<A>) => Config<B>; // overload 1
export declare const mapOrFail: <A, B>(self: Config<A>, f: (a: A) => Effect.Effect<B, ConfigError>): Config<B>; // overload 2
export declare const nonEmptyString: (name?: string): Config<string>;
export declare const number: (name?: string): Config<number>;
export declare const option: <A>(self: Config<A>): Config<Option.Option<A>>;
export declare const orElse: <A2>(that: (error: ConfigError) => Config<A2>): <A>(self: Config<A>) => Config<A2 | A>; // overload 1
export declare const orElse: <A, A2>(self: Config<A>, that: (error: ConfigError) => Config<A2>): Config<A | A2>; // overload 2
export declare const port: (name?: string): Config<number>;
export declare const Record: <K extends Schema.Record.Key, V extends Schema.Top>(key: K, value: V, options?: { readonly separator?: string | undefined; readonly keyValueSeparator?: string | undefined; }): Schema.Union<readonly [Schema.$Record<K, V>, Schema.compose<Schema.$Record<K, V>, Schema.decodeTo<Schema.$Record<Schema.String, Schema.String>, Schema.String, never, never>>]>;
export declare const redacted: (name?: string): Config<Redacted<string>>;
export declare const schema: <T, E>(codec: Schema.Codec<T, E>, path?: string | ConfigProvider.Path): Config<T>;
export declare const string: (name?: string): Config<string>;
export declare const succeed: <T>(value: T): Config<T>;
export declare const unwrap: <T>(wrapped: Wrap<T>): Config<T>;
export declare const url: (name?: string): Config<URL>;
export declare const withDefault: <const A2>(defaultValue: LazyArg<A2>): <A>(self: Config<A>) => Config<A2 | A>; // overload 1
export declare const withDefault: <A, const A2>(self: Config<A>, defaultValue: LazyArg<A2>): Config<A | A2>; // overload 2
```

## Other Exports (Non-Function)

- `Boolean` (variable)
- `Config` (interface)
- `ConfigError` (class)
- `Duration` (variable)
- `FalseValues` (variable)
- `LogLevel` (variable)
- `Port` (variable)
- `TrueValues` (variable)
- `Wrap` (type)
