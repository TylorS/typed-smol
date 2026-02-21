# API Reference: effect/unstable/sql/Statement

- Import path: `effect/unstable/sql/Statement`
- Source file: `packages/effect/src/unstable/sql/Statement.ts`
- Function exports (callable): 22
- Non-function exports: 19

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `and`
- `arrayHelper`
- `csv`
- `custom`
- `defaultEscape`
- `defaultTransforms`
- `fragment`
- `identifier`
- `isCustom`
- `isFragment`
- `join`
- `literal`
- `make`
- `makeCompiler`
- `makeCompilerSqlite`
- `or`
- `parameter`
- `primitiveKind`

## All Function Signatures

```ts
export declare const and: (clauses: ReadonlyArray<string | Fragment>): Fragment;
export declare const arrayHelper: (value: ReadonlyArray<unknown | Fragment>): ArrayHelper;
export declare const csv: (values: ReadonlyArray<string | Fragment>): Fragment; // overload 1
export declare const csv: (prefix: string, values: ReadonlyArray<string | Fragment>): Fragment; // overload 2
export declare const custom: <C extends Custom<any, any, any, any>>(kind: C["kind"]): (paramA: C["paramA"], paramB: C["paramB"], paramC: C["paramC"]) => C;
export declare const defaultEscape: (c: string): (str: string) => string;
export declare const defaultTransforms: (transformer: (str: string) => string, nested?: boolean): { readonly value: (value: any) => any; readonly object: (obj: Record<string, any>) => any; readonly array: <A extends object>(rows: ReadonlyArray<A>) => ReadonlyArray<A>; };
export declare const fragment: (segments: ReadonlyArray<Segment>): Fragment;
export declare const identifier: (value: string): Identifier;
export declare const isCustom: <A extends Custom<any, any, any, any>>(kind: A["kind"]): (u: unknown) => u is A;
export declare const isFragment: (u: unknown): u is Fragment;
export declare const join: (lit: string, addParens?: boolean, fallback?: string): (clauses: ReadonlyArray<string | Fragment>) => Fragment;
export declare const literal: (value: string, params?: ReadonlyArray<unknown> | undefined): Literal;
export declare const make: (acquirer: Acquirer, compiler: Compiler, spanAttributes: ReadonlyArray<readonly [string, unknown]>, transformRows: (<A extends object>(row: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined): Constructor;
export declare const makeCompiler: <C extends Custom<any, any, any, any> = any>(options: CompilerOptions<C>): Compiler;
export declare const makeCompilerSqlite: (transform?: ((_: string) => string) | undefined): Compiler;
export declare const or: (clauses: ReadonlyArray<string | Fragment>): Fragment;
export declare const parameter: (value: unknown): Parameter;
export declare const primitiveKind: (value: unknown): PrimitiveKind;
export declare const recordInsertHelper: (value: ReadonlyArray<Record<string, unknown>>): RecordInsertHelper;
export declare const recordUpdateHelper: (value: ReadonlyArray<Record<string, unknown>>, alias: string): RecordUpdateHelper;
export declare const recordUpdateHelperSingle: (value: Record<string, unknown>, omit: ReadonlyArray<string>): RecordUpdateHelperSingle;
export declare const statement: <A = Row>(acquirer: Acquirer, compiler: Compiler, strings: TemplateStringsArray, args: Array<any>, spanAttributes: ReadonlyArray<readonly [string, unknown]>, transformRows: (<A extends object>(row: ReadonlyArray<A>) => ReadonlyArray<A>) | undefined): Statement<A>;
```

## Other Exports (Non-Function)

- `ArrayHelper` (interface)
- `Compiler` (interface)
- `CompilerOptions` (type)
- `Constructor` (interface)
- `CurrentTransformer` (variable)
- `Custom` (interface)
- `Dialect` (type)
- `Fragment` (interface)
- `Helper` (type)
- `Identifier` (interface)
- `Literal` (interface)
- `Parameter` (interface)
- `PrimitiveKind` (type)
- `RecordInsertHelper` (interface)
- `RecordUpdateHelper` (interface)
- `RecordUpdateHelperSingle` (interface)
- `Segment` (type)
- `Statement` (interface)
- `Transformer` (type)
