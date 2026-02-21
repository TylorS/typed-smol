# API Reference: effect/unstable/cli/Flag

- Import path: `effect/unstable/cli/Flag`
- Source file: `packages/effect/src/unstable/cli/Flag.ts`
- Function exports (callable): 33
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `atLeast`
- `atMost`
- `between`
- `boolean`
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
- `keyValuePair`
- `map`

## All Function Signatures

```ts
export declare const atLeast: <A>(min: number): (self: Flag<A>) => Flag<ReadonlyArray<A>>; // overload 1
export declare const atLeast: <A>(self: Flag<A>, min: number): Flag<ReadonlyArray<A>>; // overload 2
export declare const atMost: <A>(max: number): (self: Flag<A>) => Flag<ReadonlyArray<A>>; // overload 1
export declare const atMost: <A>(self: Flag<A>, max: number): Flag<ReadonlyArray<A>>; // overload 2
export declare const between: <A>(min: number, max: number): (self: Flag<A>) => Flag<ReadonlyArray<A>>; // overload 1
export declare const between: <A>(self: Flag<A>, min: number, max: number): Flag<ReadonlyArray<A>>; // overload 2
export declare const boolean: (name: string): Flag<boolean>;
export declare const choice: <const Choices extends ReadonlyArray<string>>(name: string, choices: Choices): Flag<Choices[number]>;
export declare const choiceWithValue: <const Choice extends ReadonlyArray<readonly [string, any]>>(name: string, choices: Choice): Flag<Choice[number][1]>;
export declare const date: (name: string): Flag<Date>;
export declare const directory: (name: string, options?: { readonly mustExist?: boolean | undefined; }): Flag<string>;
export declare const file: (name: string, options?: { readonly mustExist?: boolean | undefined; }): Flag<string>;
export declare const fileParse: (name: string, options?: Primitive.FileParseOptions | undefined): Flag<unknown>;
export declare const fileSchema: <A>(name: string, schema: Schema.Codec<A, string>, options?: Primitive.FileSchemaOptions | undefined): Flag<A>;
export declare const fileText: (name: string): Flag<string>;
export declare const filter: <A>(predicate: (a: A) => boolean, onFalse: (a: A) => string): (self: Flag<A>) => Flag<A>; // overload 1
export declare const filter: <A>(self: Flag<A>, predicate: (a: A) => boolean, onFalse: (a: A) => string): Flag<A>; // overload 2
export declare const filterMap: <A, B>(f: (a: A) => Option.Option<B>, onNone: (a: A) => string): (self: Flag<A>) => Flag<B>; // overload 1
export declare const filterMap: <A, B>(self: Flag<A>, f: (a: A) => Option.Option<B>, onNone: (a: A) => string): Flag<B>; // overload 2
export declare const float: (name: string): Flag<number>;
export declare const integer: (name: string): Flag<number>;
export declare const keyValuePair: (name: string): Flag<Record<string, string>>;
export declare const map: <A, B>(f: (a: A) => B): (self: Flag<A>) => Flag<B>; // overload 1
export declare const map: <A, B>(self: Flag<A>, f: (a: A) => B): Flag<B>; // overload 2
export declare const mapEffect: <A, B>(f: (a: A) => Effect.Effect<B, CliError.CliError, Param.Environment>): (self: Flag<A>) => Flag<B>; // overload 1
export declare const mapEffect: <A, B>(self: Flag<A>, f: (a: A) => Effect.Effect<B, CliError.CliError, Param.Environment>): Flag<B>; // overload 2
export declare const mapTryCatch: <A, B>(f: (a: A) => B, onError: (error: unknown) => string): (self: Flag<A>) => Flag<B>; // overload 1
export declare const mapTryCatch: <A, B>(self: Flag<A>, f: (a: A) => B, onError: (error: unknown) => string): Flag<B>; // overload 2
export declare const optional: <A>(param: Flag<A>): Flag<Option.Option<A>>;
export declare const orElse: <B>(that: LazyArg<Flag<B>>): <A>(self: Flag<A>) => Flag<A | B>; // overload 1
export declare const orElse: <A, B>(self: Flag<A>, that: LazyArg<Flag<B>>): Flag<A | B>; // overload 2
export declare const orElseResult: <B>(that: LazyArg<Flag<B>>): <A>(self: Flag<A>) => Flag<Result.Result<A, B>>; // overload 1
export declare const orElseResult: <A, B>(self: Flag<A>, that: LazyArg<Flag<B>>): Flag<Result.Result<A, B>>; // overload 2
export declare const path: (name: string, options?: { readonly pathType?: "file" | "directory" | "either" | undefined; readonly mustExist?: boolean | undefined; readonly typeName?: string | undefined; }): Flag<string>;
export declare const redacted: (name: string): Flag<Redacted.Redacted<string>>;
export declare const string: (name: string): Flag<string>;
export declare const withAlias: <A>(alias: string): (self: Flag<A>) => Flag<A>; // overload 1
export declare const withAlias: <A>(self: Flag<A>, alias: string): Flag<A>; // overload 2
export declare const withDefault: <const B>(defaultValue: B | Effect.Effect<B, CliError.CliError, Param.Environment>): <A>(self: Flag<A>) => Flag<A | B>; // overload 1
export declare const withDefault: <A, const B>(self: Flag<A>, defaultValue: B | Effect.Effect<B, CliError.CliError, Param.Environment>): Flag<A | B>; // overload 2
export declare const withDescription: <A>(description: string): (self: Flag<A>) => Flag<A>; // overload 1
export declare const withDescription: <A>(self: Flag<A>, description: string): Flag<A>; // overload 2
export declare const withFallbackConfig: <B>(config: Config.Config<B>): <A>(self: Flag<A>) => Flag<A | B>; // overload 1
export declare const withFallbackConfig: <A, B>(self: Flag<A>, config: Config.Config<B>): Flag<A | B>; // overload 2
export declare const withFallbackPrompt: <B>(prompt: Prompt.Prompt<B>): <A>(self: Flag<A>) => Flag<A | B>; // overload 1
export declare const withFallbackPrompt: <A, B>(self: Flag<A>, prompt: Prompt.Prompt<B>): Flag<A | B>; // overload 2
export declare const withMetavar: <A>(metavar: string): (self: Flag<A>) => Flag<A>; // overload 1
export declare const withMetavar: <A>(self: Flag<A>, metavar: string): Flag<A>; // overload 2
export declare const withSchema: <A, B>(schema: Schema.Codec<B, A>): (self: Flag<A>) => Flag<B>; // overload 1
export declare const withSchema: <A, B>(self: Flag<A>, schema: Schema.Codec<B, A>): Flag<B>; // overload 2
```

## Other Exports (Non-Function)

- `Flag` (interface)
- `none` (variable)
