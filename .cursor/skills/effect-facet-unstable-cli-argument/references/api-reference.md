# API Reference: effect/unstable/cli/Argument

- Import path: `effect/unstable/cli/Argument`
- Source file: `packages/effect/src/unstable/cli/Argument.ts`
- Function exports (callable): 31
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `atLeast`
- `atMost`
- `between`
- `choice`
- `choiceWithValue`
- `date`
- `directory`
- `file`
- `fileParse`
- `fileSchema`
- `fileText`
- `filter`
- `filterMap`
- `float`
- `integer`
- `map`
- `mapEffect`
- `mapTryCatch`

## All Function Signatures

```ts
export declare const atLeast: <A>(min: number): (self: Argument<A>) => Argument<ReadonlyArray<A>>; // overload 1
export declare const atLeast: <A>(self: Argument<A>, min: number): Argument<ReadonlyArray<A>>; // overload 2
export declare const atMost: <A>(max: number): (self: Argument<A>) => Argument<ReadonlyArray<A>>; // overload 1
export declare const atMost: <A>(self: Argument<A>, max: number): Argument<ReadonlyArray<A>>; // overload 2
export declare const between: <A>(min: number, max: number): (self: Argument<A>) => Argument<ReadonlyArray<A>>; // overload 1
export declare const between: <A>(self: Argument<A>, min: number, max: number): Argument<ReadonlyArray<A>>; // overload 2
export declare const choice: <const Choices extends ReadonlyArray<string>>(name: string, choices: Choices): Argument<Choices[number]>;
export declare const choiceWithValue: <const Choices extends ReadonlyArray<readonly [string, any]>>(name: string, choices: Choices): Argument<Choices[number][1]>;
export declare const date: (name: string): Argument<Date>;
export declare const directory: (name: string, options?: { readonly mustExist?: boolean | undefined; }): Argument<string>;
export declare const file: (name: string, options?: { readonly mustExist?: boolean | undefined; }): Argument<string>;
export declare const fileParse: (name: string, options?: Primitive.FileParseOptions | undefined): Argument<unknown>;
export declare const fileSchema: <A>(name: string, schema: Schema.Codec<A, string>, options?: Primitive.FileSchemaOptions | undefined): Argument<A>;
export declare const fileText: (name: string): Argument<string>;
export declare const filter: <A>(predicate: (a: A) => boolean, onFalse: (a: A) => string): (self: Argument<A>) => Argument<A>; // overload 1
export declare const filter: <A>(self: Argument<A>, predicate: (a: A) => boolean, onFalse: (a: A) => string): Argument<A>; // overload 2
export declare const filterMap: <A, B>(f: (a: A) => Option.Option<B>, onNone: (a: A) => string): (self: Argument<A>) => Argument<B>; // overload 1
export declare const filterMap: <A, B>(self: Argument<A>, f: (a: A) => Option.Option<B>, onNone: (a: A) => string): Argument<B>; // overload 2
export declare const float: (name: string): Argument<number>;
export declare const integer: (name: string): Argument<number>;
export declare const map: <A, B>(f: (a: A) => B): (self: Argument<A>) => Argument<B>; // overload 1
export declare const map: <A, B>(self: Argument<A>, f: (a: A) => B): Argument<B>; // overload 2
export declare const mapEffect: <A, B>(f: (a: A) => Effect.Effect<B, CliError.CliError, Param.Environment>): (self: Argument<A>) => Argument<B>; // overload 1
export declare const mapEffect: <A, B>(self: Argument<A>, f: (a: A) => Effect.Effect<B, CliError.CliError, Param.Environment>): Argument<B>; // overload 2
export declare const mapTryCatch: <A, B>(f: (a: A) => B, onError: (error: unknown) => string): (self: Argument<A>) => Argument<B>; // overload 1
export declare const mapTryCatch: <A, B>(self: Argument<A>, f: (a: A) => B, onError: (error: unknown) => string): Argument<B>; // overload 2
export declare const optional: <A>(arg: Argument<A>): Argument<Option.Option<A>>;
export declare const orElse: <B>(that: LazyArg<Argument<B>>): <A>(self: Argument<A>) => Argument<A | B>; // overload 1
export declare const orElse: <A, B>(self: Argument<A>, that: LazyArg<Argument<B>>): Argument<A | B>; // overload 2
export declare const orElseResult: <B>(that: LazyArg<Argument<B>>): <A>(self: Argument<A>) => Argument<Result.Result<A, B>>; // overload 1
export declare const orElseResult: <A, B>(self: Argument<A>, that: LazyArg<Argument<B>>): Argument<Result.Result<A, B>>; // overload 2
export declare const path: (name: string, options?: { pathType?: "file" | "directory" | "either"; mustExist?: boolean; }): Argument<string>;
export declare const redacted: (name: string): Argument<Redacted.Redacted<string>>;
export declare const string: (name: string): Argument<string>;
export declare const variadic: (options?: Param.VariadicParamOptions | undefined): <A>(self: Argument<A>) => Argument<ReadonlyArray<A>>; // overload 1
export declare const variadic: <A>(self: Argument<A>, options?: Param.VariadicParamOptions | undefined): Argument<ReadonlyArray<A>>; // overload 2
export declare const withDefault: <const B>(defaultValue: B | Effect.Effect<B, CliError.CliError, Param.Environment>): <A>(self: Argument<A>) => Argument<A | B>; // overload 1
export declare const withDefault: <A, const B>(self: Argument<A>, defaultValue: B | Effect.Effect<B, CliError.CliError, Param.Environment>): Argument<A | B>; // overload 2
export declare const withDescription: <A>(description: string): (self: Argument<A>) => Argument<A>; // overload 1
export declare const withDescription: <A>(self: Argument<A>, description: string): Argument<A>; // overload 2
export declare const withFallbackConfig: <B>(config: Config.Config<B>): <A>(self: Argument<A>) => Argument<A | B>; // overload 1
export declare const withFallbackConfig: <A, B>(self: Argument<A>, config: Config.Config<B>): Argument<A | B>; // overload 2
export declare const withFallbackPrompt: <B>(prompt: Prompt.Prompt<B>): <A>(self: Argument<A>) => Argument<A | B>; // overload 1
export declare const withFallbackPrompt: <A, B>(self: Argument<A>, prompt: Prompt.Prompt<B>): Argument<A | B>; // overload 2
export declare const withMetavar: <A>(metavar: string): (self: Argument<A>) => Argument<A>; // overload 1
export declare const withMetavar: <A>(self: Argument<A>, metavar: string): Argument<A>; // overload 2
export declare const withSchema: <A, B>(schema: Schema.Codec<B, A>): (self: Argument<A>) => Argument<B>; // overload 1
export declare const withSchema: <A, B>(self: Argument<A>, schema: Schema.Codec<B, A>): Argument<B>; // overload 2
```

## Other Exports (Non-Function)

- `Argument` (interface)
- `none` (variable)
