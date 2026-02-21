# API Reference: effect/SchemaAST

- Import path: `effect/SchemaAST`
- Source file: `packages/effect/src/SchemaAST.ts`
- Function exports (callable): 71
- Non-function exports: 55

## Purpose

Abstract Syntax Tree (AST) representation for Effect schemas.

## Key Function Exports

- `annotate`
- `annotateKey`
- `appendChecks`
- `applyToLastLink`
- `brand`
- `collectIssues`
- `collectSentinels`
- `containsUndefined`
- `decodeTo`
- `enumsToLiterals`
- `flip`
- `getAST`
- `getCandidates`
- `getIndexSignatureKeys`
- `getTemplateLiteralRegExp`
- `isAny`
- `isArrays`
- `isAST`

## All Function Signatures

```ts
export declare const annotate: <A extends AST>(ast: A, annotations: Schema.Annotations.Annotations): A;
export declare const annotateKey: <A extends AST>(ast: A, annotations: Schema.Annotations.Key<unknown>): A;
export declare const appendChecks: <A extends AST>(ast: A, checks: Checks): A;
export declare const applyToLastLink: (f: (ast: AST) => AST): <A extends AST>(ast: A) => A;
export declare const brand: (ast: AST, brand: string): AST;
export declare const collectIssues: <T>(checks: ReadonlyArray<Check<T>>, value: T, issues: Array<Issue.Issue>, ast: AST, options: ParseOptions): void;
export declare const collectSentinels: (ast: AST): Array<Sentinel> | undefined;
export declare const containsUndefined: (ast: AST): boolean;
export declare const decodeTo: <A extends AST>(from: AST, to: A, transformation: Transformation.Transformation<any, any, any, any>): A;
export declare const enumsToLiterals: (ast: Enum): Union<Literal>;
export declare const flip: (ast: AST): AST;
export declare const getAST: <S extends Schema.Top>(self: S): S["ast"];
export declare const getCandidates: (input: any, types: ReadonlyArray<AST>): ReadonlyArray<AST>;
export declare const getIndexSignatureKeys: (input: { readonly [x: PropertyKey]: unknown; }, parameter: AST): ReadonlyArray<PropertyKey>;
export declare const getTemplateLiteralRegExp: (ast: TemplateLiteral): RegExp;
export declare const isAny: (ast: AST): ast is Any;
export declare const isArrays: (ast: AST): ast is Arrays;
export declare const isAST: (u: unknown): u is AST;
export declare const isBigInt: (ast: AST): ast is BigInt;
export declare const isBoolean: (ast: AST): ast is Boolean;
export declare const isDeclaration: (ast: AST): ast is Declaration;
export declare const isEnum: (ast: AST): ast is Enum;
export declare const isLiteral: (ast: AST): ast is Literal;
export declare const isMutable: (ast: AST): boolean;
export declare const isNever: (ast: AST): ast is Never;
export declare const isNull: (ast: AST): ast is Null;
export declare const isNumber: (ast: AST): ast is Number;
export declare const isObjectKeyword: (ast: AST): ast is ObjectKeyword;
export declare const isObjects: (ast: AST): ast is Objects;
export declare const isOptional: (ast: AST): boolean;
export declare const isPattern: (regExp: globalThis.RegExp, annotations?: Schema.Annotations.Filter): Filter<string>;
export declare const isString: (ast: AST): ast is String;
export declare const isStringBigInt: (annotations?: Schema.Annotations.Filter): Filter<string>;
export declare const isStringFinite: (annotations?: Schema.Annotations.Filter): Filter<string>;
export declare const isStringSymbol: (annotations?: Schema.Annotations.Filter): Filter<string>;
export declare const isSuspend: (ast: AST): ast is Suspend;
export declare const isSymbol: (ast: AST): ast is Symbol;
export declare const isTemplateLiteral: (ast: AST): ast is TemplateLiteral;
export declare const isUndefined: (ast: AST): ast is Undefined;
export declare const isUnion: (ast: AST): ast is Union<AST>;
export declare const isUniqueSymbol: (ast: AST): ast is UniqueSymbol;
export declare const isUnknown: (ast: AST): ast is Unknown;
export declare const isVoid: (ast: AST): ast is Void;
export declare const makeFilter: <T>(filter: (input: T, ast: AST, options: ParseOptions) => undefined | boolean | string | Issue.Issue | { readonly path: ReadonlyArray<PropertyKey>; readonly message: string; }, annotations?: Schema.Annotations.Filter | undefined, aborted?: boolean): Filter<T>;
export declare const makeFilterByGuard: <T extends E, E>(is: (value: E) => value is T, annotations?: Schema.Annotations.Filter): Filter<any>;
export declare const mapOrSame: <A>(as: Arr.NonEmptyReadonlyArray<A>, f: (a: A) => A): Arr.NonEmptyReadonlyArray<A>; // overload 1
export declare const mapOrSame: <A>(as: ReadonlyArray<A>, f: (a: A) => A): ReadonlyArray<A>; // overload 2
export declare const memoizeThunk: <A>(f: () => A): () => A;
export declare const middlewareDecoding: (ast: AST, middleware: Transformation.Middleware<any, any, any, any, any, any>): AST;
export declare const middlewareEncoding: (ast: AST, middleware: Transformation.Middleware<any, any, any, any, any, any>): AST;
export declare const mutableKey: <A extends AST>(ast: A): A;
export declare const optionalKey: <A extends AST>(ast: A): A;
export declare const optionalKeyLastLink: <A extends AST>(ast: A): A;
export declare const record: (key: AST, value: AST, keyValueCombiner: KeyValueCombiner | undefined): Objects;
export declare const replaceChecks: <A extends AST>(ast: A, checks: Checks | undefined): A;
export declare const replaceContext: <A extends AST>(ast: A, context: Context | undefined): A;
export declare const replaceEncoding: <A extends AST>(ast: A, encoding: Encoding | undefined): A;
export declare const resolve: (ast: AST): Schema.Annotations.Annotations | undefined;
export declare const resolveAt: <A>(key: string): (ast: AST) => A | undefined;
export declare const resolveDescription: (ast: AST): string | undefined;
export declare const resolveIdentifier: (ast: AST): string | undefined;
export declare const resolveTitle: (ast: AST): string | undefined;
export declare const runChecks: <T>(checks: readonly [Check<T>, ...Array<Check<T>>], s: T): Result.Result<T, Issue.Issue>;
export declare const struct: <Fields extends Schema.Struct.Fields>(fields: Fields, checks: Checks | undefined, annotations?: Schema.Annotations.Annotations): Objects;
export declare const structWithRest: (ast: Objects, records: ReadonlyArray<Objects>): Objects;
export declare const toCodec: (f: (ast: AST) => AST): (ast: AST) => AST;
export declare const toEncoded: (ast: AST): AST;
export declare const toType: <A extends AST>(ast: A): A;
export declare const tuple: <Elements extends Schema.Tuple.Elements>(elements: Elements, checks?: Checks | undefined): Arrays;
export declare const tupleWithRest: (ast: Arrays, rest: ReadonlyArray<AST>): Arrays;
export declare const union: <Members extends ReadonlyArray<Schema.Top>>(members: Members, mode: "anyOf" | "oneOf", checks: Checks | undefined): Union<Members[number]["ast"]>;
export declare const withConstructorDefault: <A extends AST>(ast: A, defaultValue: (input: Option.Option<undefined>) => Option.Option<unknown> | Effect.Effect<Option.Option<unknown>>): A;
```

## Other Exports (Non-Function)

- `any` (variable)
- `Any` (class)
- `Arrays` (class)
- `AST` (type)
- `Base` (class)
- `bigInt` (variable)
- `BigInt` (class)
- `bigIntString` (variable)
- `boolean` (variable)
- `Boolean` (class)
- `Check` (type)
- `Checks` (type)
- `ClassTypeId` (variable)
- `Context` (class)
- `Declaration` (class)
- `defaultParseOptions` (variable)
- `Encoding` (type)
- `Enum` (class)
- `Filter` (class)
- `FilterGroup` (class)
- `FINITE_PATTERN` (variable)
- `IndexSignature` (class)
- `KeyValueCombiner` (class)
- `Link` (class)
- `Literal` (class)
- `LiteralValue` (type)
- `never` (variable)
- `Never` (class)
- `null` (variable)
- `Null` (class)
- `number` (variable)
- `Number` (class)
- `objectKeyword` (variable)
- `ObjectKeyword` (class)
- `Objects` (class)
- `ParseOptions` (interface)
- `PropertySignature` (class)
- `Sentinel` (type)
- `string` (variable)
- `String` (class)
- `STRING_PATTERN` (variable)
- `STRUCTURAL_ANNOTATION_KEY` (variable)
- `Suspend` (class)
- `symbol` (variable)
- `Symbol` (class)
- `symbolString` (variable)
- `TemplateLiteral` (class)
- `undefined` (variable)
- `Undefined` (class)
- `Union` (class)
- `UniqueSymbol` (class)
- `unknown` (variable)
- `Unknown` (class)
- `void` (variable)
- `Void` (class)
