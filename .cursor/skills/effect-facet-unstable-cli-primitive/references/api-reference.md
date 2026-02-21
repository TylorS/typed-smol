# API Reference: effect/unstable/cli/Primitive

- Import path: `effect/unstable/cli/Primitive`
- Source file: `packages/effect/src/unstable/cli/Primitive.ts`
- Function exports (callable): 9
- Non-function exports: 13

## Purpose

Primitive types for CLI parameter parsing.

## Key Function Exports

- `choice`
- `fileParse`
- `fileSchema`
- `getChoiceKeys`
- `getTypeName`
- `isBoolean`
- `isFalseValue`
- `isTrueValue`
- `path`

## All Function Signatures

```ts
export declare const choice: <A>(choices: ReadonlyArray<readonly [string, A]>): Primitive<A>;
export declare const fileParse: (options?: FileParseOptions): Primitive<unknown>;
export declare const fileSchema: <A>(schema: Schema.Codec<A, string>, options?: FileSchemaOptions | undefined): Primitive<A>;
export declare const getChoiceKeys: (primitive: Primitive<unknown>): ReadonlyArray<string> | undefined;
export declare const getTypeName: <A>(primitive: Primitive<A>): string;
export declare const isBoolean: (p: Primitive<unknown>): p is Primitive<boolean>;
export declare const isFalseValue: <I>(input: I): input is I & ("0" | "false" | "no" | "off" | "n");
export declare const isTrueValue: <I>(input: I): input is I & ("true" | "yes" | "1" | "on" | "y");
export declare const path: (pathType: PathType, mustExist?: boolean): Primitive<string>;
```

## Other Exports (Non-Function)

- `boolean` (variable)
- `date` (variable)
- `FileParseOptions` (type)
- `FileSchemaOptions` (type)
- `fileText` (variable)
- `float` (variable)
- `integer` (variable)
- `keyValuePair` (variable)
- `none` (variable)
- `PathType` (type)
- `Primitive` (interface)
- `redacted` (variable)
- `string` (variable)
