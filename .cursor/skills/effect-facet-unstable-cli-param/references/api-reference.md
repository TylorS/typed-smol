# API Reference: effect/unstable/cli/Param

- Import path: `effect/unstable/cli/Param`
- Source file: `packages/effect/src/unstable/cli/Param.ts`
- Function exports (callable): 42
- Non-function exports: 17

## Purpose

Param is the polymorphic implementation shared by Argument.ts and Flag.ts. The `Kind` type parameter ("argument" | "flag") enables type-safe separation while sharing parsing logic and combinators.

## Key Function Exports

- `atLeast`
- `atMost`
- `between`
- `boolean`
- `choice`
- `choiceWithValue`
- `date`
- `directory`
- `extractSingleParams`
- `file`
- `fileParse`
- `fileSchema`
- `fileText`
- `filter`
- `filterMap`
- `float`
- `getParamMetadata`
- `getUnderlyingSingleOrThrow`

## All Function Signatures

```ts
export declare const atLeast: <A>(min: number): <Kind extends ParamKind>(self: Param<Kind, A>) => Param<Kind, ReadonlyArray<A>>; // overload 1
export declare const atLeast: <Kind extends ParamKind, A>(self: Param<Kind, A>, min: number): Param<Kind, ReadonlyArray<A>>; // overload 2
export declare const atMost: <A>(max: number): <Kind extends ParamKind>(self: Param<Kind, A>) => Param<Kind, ReadonlyArray<A>>; // overload 1
export declare const atMost: <Kind extends ParamKind, A>(self: Param<Kind, A>, max: number): Param<Kind, ReadonlyArray<A>>; // overload 2
export declare const between: <A>(min: number, max: number): <Kind extends ParamKind>(self: Param<Kind, A>) => Param<Kind, ReadonlyArray<A>>; // overload 1
export declare const between: <Kind extends ParamKind, A>(self: Param<Kind, A>, min: number, max: number): Param<Kind, ReadonlyArray<A>>; // overload 2
export declare const boolean: <const Kind extends ParamKind>(kind: Kind, name: string): Param<Kind, boolean>;
export declare const choice: <const Kind extends ParamKind, const Choices extends ReadonlyArray<string>>(kind: Kind, name: string, choices: Choices): Param<Kind, Choices[number]>;
export declare const choiceWithValue: <const Kind extends ParamKind, const Choices extends ReadonlyArray<readonly [string, any]>>(kind: Kind, name: string, choices: Choices): Param<Kind, Choices[number][1]>;
export declare const date: <const Kind extends ParamKind>(kind: Kind, name: string): Param<Kind, Date>;
export declare const directory: <Kind extends ParamKind>(kind: Kind, name: string, options?: { readonly mustExist?: boolean | undefined; }): Param<Kind, string>;
export declare const extractSingleParams: <Kind extends ParamKind, A>(param: Param<Kind, A>): Array<Single<Kind, unknown>>;
export declare const file: <Kind extends ParamKind>(kind: Kind, name: string, options?: { readonly mustExist?: boolean | undefined; }): Param<Kind, string>;
export declare const fileParse: <Kind extends ParamKind>(kind: Kind, name: string, options?: Primitive.FileParseOptions | undefined): Param<Kind, unknown>;
export declare const fileSchema: <Kind extends ParamKind, A>(kind: Kind, name: string, schema: Schema.Codec<A, string>, options?: Primitive.FileSchemaOptions | undefined): Param<Kind, A>;
export declare const fileText: <Kind extends ParamKind>(kind: Kind, name: string): Param<Kind, string>;
export declare const filter: <A>(predicate: Predicate.Predicate<A>, onFalse: (a: A) => string): <Kind extends ParamKind>(self: Param<Kind, A>) => Param<Kind, A>; // overload 1
export declare const filter: <Kind extends ParamKind, A>(self: Param<Kind, A>, predicate: Predicate.Predicate<A>, onFalse: (a: A) => string): Param<Kind, A>; // overload 2
export declare const filterMap: <A, B>(filter: (a: A) => Option.Option<B>, onNone: (a: A) => string): <Kind extends ParamKind>(self: Param<Kind, A>) => Param<Kind, B>; // overload 1
export declare const filterMap: <Kind extends ParamKind, A, B>(self: Param<Kind, A>, filter: (a: A) => Option.Option<B>, onNone: (a: A) => string): Param<Kind, B>; // overload 2
export declare const float: <const Kind extends ParamKind>(kind: Kind, name: string): Param<Kind, number>;
export declare const getParamMetadata: <Kind extends ParamKind, A>(param: Param<Kind, A>): { isOptional: boolean; isVariadic: boolean; };
export declare const getUnderlyingSingleOrThrow: <Kind extends ParamKind, A>(param: Param<Kind, A>): Single<Kind, A>;
export declare const integer: <const Kind extends ParamKind>(kind: Kind, name: string): Param<Kind, number>;
export declare const isFlagParam: <A>(single: Single<ParamKind, A>): single is Single<typeof flagKind, A>;
export declare const isParam: (u: unknown): u is Param<any, ParamKind>;
export declare const isSingle: <const Kind extends ParamKind, A>(param: Param<Kind, A>): param is Single<Kind, A>;
export declare const keyValuePair: <Kind extends ParamKind>(kind: Kind, name: string): Param<Kind, Record<string, string>>;
export declare const makeSingle: <const Kind extends ParamKind, A>(params: { readonly kind: Kind; readonly name: string; readonly primitiveType: Primitive.Primitive<A>; readonly typeName?: string | undefined; readonly description?: string | undefined; readonly aliases?: ReadonlyArray<string> | undefined; }): Single<Kind, A>;
export declare const map: <A, B>(f: (a: A) => B): <Kind extends ParamKind>(self: Param<Kind, A>) => Param<Kind, B>; // overload 1
export declare const map: <Kind extends ParamKind, A, B>(self: Param<Kind, A>, f: (a: A) => B): Param<Kind, B>; // overload 2
export declare const mapEffect: <A, B>(f: (a: A) => Effect.Effect<B, CliError.CliError, Environment>): <Kind extends ParamKind>(self: Param<Kind, A>) => Param<Kind, B>; // overload 1
export declare const mapEffect: <Kind extends ParamKind, A, B>(self: Param<Kind, A>, f: (a: A) => Effect.Effect<B, CliError.CliError, Environment>): Param<Kind, B>; // overload 2
export declare const mapTryCatch: <A, B>(f: (a: A) => B, onError: (error: unknown) => string): <Kind extends ParamKind>(self: Param<Kind, A>) => Param<Kind, B>; // overload 1
export declare const mapTryCatch: <Kind extends ParamKind, A, B>(self: Param<Kind, A>, f: (a: A) => B, onError: (error: unknown) => string): Param<Kind, B>; // overload 2
export declare const none: <Kind extends ParamKind>(kind: Kind): Param<Kind, never>;
export declare const optional: <Kind extends ParamKind, A>(param: Param<Kind, A>): Param<Kind, Option.Option<A>>;
export declare const orElse: <B, Kind extends ParamKind>(orElse: (error: CliError.CliError) => Param<Kind, B>): <A>(self: Param<Kind, A>) => Param<Kind, A | B>; // overload 1
export declare const orElse: <Kind extends ParamKind, A, B>(self: Param<Kind, A>, orElse: (error: CliError.CliError) => Param<Kind, B>): Param<Kind, A | B>; // overload 2
export declare const orElseResult: <Kind extends ParamKind, B>(orElse: (error: CliError.CliError) => Param<Kind, B>): <A>(self: Param<Kind, A>) => Param<Kind, Result.Result<A, B>>; // overload 1
export declare const orElseResult: <Kind extends ParamKind, A, B>(self: Param<Kind, A>, orElse: (error: CliError.CliError) => Param<Kind, B>): Param<Kind, Result.Result<A, B>>; // overload 2
export declare const path: <Kind extends ParamKind>(kind: Kind, name: string, options?: { readonly pathType?: Primitive.PathType | undefined; readonly mustExist?: boolean | undefined; readonly typeName?: string | undefined; }): Param<Kind, string>;
export declare const redacted: <Kind extends ParamKind>(kind: Kind, name: string): Param<Kind, Redacted.Redacted<string>>;
export declare const string: <const Kind extends ParamKind>(kind: Kind, name: string): Param<Kind, string>;
export declare const variadic: <Kind extends ParamKind, A>(self: Param<Kind, A>, options?: VariadicParamOptions | undefined): Param<Kind, ReadonlyArray<A>>;
export declare const withAlias: <Kind extends ParamKind, A>(alias: string): (self: Param<Kind, A>) => Param<Kind, A>; // overload 1
export declare const withAlias: <Kind extends ParamKind, A>(self: Param<Kind, A>, alias: string): Param<Kind, A>; // overload 2
export declare const withDefault: <const B>(defaultValue: B | Effect.Effect<B, CliError.CliError, Environment>): <Kind extends ParamKind, A>(self: Param<Kind, A>) => Param<Kind, A | B>; // overload 1
export declare const withDefault: <Kind extends ParamKind, A, const B>(self: Param<Kind, A>, defaultValue: B | Effect.Effect<B, CliError.CliError, Environment>): Param<Kind, A | B>; // overload 2
export declare const withDescription: <Kind extends ParamKind, A>(description: string): (self: Param<Kind, A>) => Param<Kind, A>; // overload 1
export declare const withDescription: <Kind extends ParamKind, A>(self: Param<Kind, A>, description: string): Param<Kind, A>; // overload 2
export declare const withFallbackConfig: <B>(config: Config.Config<B>): <Kind extends ParamKind, A>(self: Param<Kind, A>) => Param<Kind, A | B>; // overload 1
export declare const withFallbackConfig: <Kind extends ParamKind, A, B>(self: Param<Kind, A>, config: Config.Config<B>): Param<Kind, A | B>; // overload 2
export declare const withFallbackPrompt: <B>(prompt: Prompt.Prompt<B>): <Kind extends ParamKind, A>(self: Param<Kind, A>) => Param<Kind, A | B>; // overload 1
export declare const withFallbackPrompt: <Kind extends ParamKind, A, B>(self: Param<Kind, A>, prompt: Prompt.Prompt<B>): Param<Kind, A | B>; // overload 2
export declare const withMetavar: <K extends ParamKind>(metavar: string): <A>(self: Param<K, A>) => Param<K, A>; // overload 1
export declare const withMetavar: <K extends ParamKind, A>(self: Param<K, A>, metavar: string): Param<K, A>; // overload 2
export declare const withSchema: <A, B>(schema: Schema.Codec<B, A>): <Kind extends ParamKind>(self: Param<Kind, A>) => Param<Kind, B>; // overload 1
export declare const withSchema: <Kind extends ParamKind, A, B>(self: Param<Kind, A>, schema: Schema.Codec<B, A>): Param<Kind, B>; // overload 2
```

## Other Exports (Non-Function)

- `Any` (type)
- `AnyArgument` (type)
- `AnyFlag` (type)
- `argumentKind` (variable)
- `Environment` (type)
- `flagKind` (variable)
- `Flags` (type)
- `Map` (interface)
- `Optional` (interface)
- `Param` (interface)
- `ParamKind` (type)
- `Parse` (type)
- `ParsedArgs` (interface)
- `Single` (interface)
- `Transform` (interface)
- `Variadic` (interface)
- `VariadicParamOptions` (type)
