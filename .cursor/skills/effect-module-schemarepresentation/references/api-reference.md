# API Reference: effect/SchemaRepresentation

- Import path: `effect/SchemaRepresentation`
- Source file: `packages/effect/src/SchemaRepresentation.ts`
- Function exports (callable): 13
- Non-function exports: 86

## Purpose

Serializable intermediate representation (IR) of Effect Schema types.

## Key Function Exports

- `fromAST`
- `fromASTs`
- `fromJsonSchemaDocument`
- `fromJsonSchemaMultiDocument`
- `makeCode`
- `sanitizeJavaScriptIdentifier`
- `toCodeDocument`
- `toJsonSchemaDocument`
- `toJsonSchemaMultiDocument`
- `toMultiDocument`
- `topologicalSort`
- `toSchema`
- `toSchemaDefaultReviver`

## All Function Signatures

```ts
export declare const fromAST: (ast: AST.AST): Document;
export declare const fromASTs: (asts: readonly [AST.AST, ...Array<AST.AST>]): MultiDocument;
export declare const fromJsonSchemaDocument: (document: JsonSchema.Document<"draft-2020-12">, options?: { readonly onEnter?: ((js: JsonSchema.JsonSchema) => JsonSchema.JsonSchema) | undefined; }): Document;
export declare const fromJsonSchemaMultiDocument: (document: JsonSchema.MultiDocument<"draft-2020-12">, options?: { readonly onEnter?: ((js: JsonSchema.JsonSchema) => JsonSchema.JsonSchema) | undefined; }): MultiDocument;
export declare const makeCode: (runtime: string, Type: string): Code;
export declare const sanitizeJavaScriptIdentifier: (s: string): string;
export declare const toCodeDocument: (multiDocument: MultiDocument, options?: { readonly reviver?: Reviver<Code> | undefined; }): CodeDocument;
export declare const toJsonSchemaDocument: (document: Document, options?: Schema.ToJsonSchemaOptions): JsonSchema.Document<"draft-2020-12">;
export declare const toJsonSchemaMultiDocument: (document: MultiDocument, options?: Schema.ToJsonSchemaOptions): JsonSchema.MultiDocument<"draft-2020-12">;
export declare const toMultiDocument: (document: Document): MultiDocument;
export declare const topologicalSort: (references: References): TopologicalSort;
export declare const toSchema: <S extends Schema.Top = Schema.Top>(document: Document, options?: { readonly reviver?: Reviver<Schema.Top> | undefined; }): S;
export declare const toSchemaDefaultReviver: (declaration: Declaration, recur: (representation: Representation) => Schema.Top): Schema.Top | undefined;
```

## Other Exports (Non-Function)

- `$Annotations` (variable)
- `$Any` (variable)
- `$Arrays` (variable)
- `$BigInt` (variable)
- `$Boolean` (variable)
- `$DateMeta` (variable)
- `$Declaration` (variable)
- `$DeclarationMeta` (variable)
- `$Document` (variable)
- `$Element` (variable)
- `$Enum` (variable)
- `$IndexSignature` (variable)
- `$Literal` (variable)
- `$LiteralValue` (variable)
- `$MultiDocument` (variable)
- `$Never` (variable)
- `$Null` (variable)
- `$Number` (variable)
- `$NumberMeta` (variable)
- `$ObjectKeyword` (variable)
- `$Objects` (variable)
- `$ObjectsMeta` (variable)
- `$PrimitiveTree` (variable)
- `$PropertySignature` (variable)
- `$Reference` (variable)
- `$Representation` (interface)
- `$SizeMeta` (variable)
- `$String` (variable)
- `$StringMeta` (variable)
- `$Suspend` (variable)
- `$Symbol` (variable)
- `$TemplateLiteral` (variable)
- `$Undefined` (variable)
- `$Union` (variable)
- `$UniqueSymbol` (variable)
- `$Unknown` (variable)
- `$Void` (variable)
- `Any` (interface)
- `Arrays` (interface)
- `ArraysMeta` (type)
- `Artifact` (type)
- `BigInt` (interface)
- `BigIntMeta` (type)
- `Boolean` (interface)
- `Check` (type)
- `Code` (type)
- `CodeDocument` (type)
- `DateMeta` (type)
- `Declaration` (interface)
- `DeclarationMeta` (type)
- `Document` (type)
- `DocumentFromJson` (variable)
- `Element` (interface)
- `Enum` (interface)
- `Filter` (interface)
- `FilterGroup` (interface)
- `IndexSignature` (interface)
- `Literal` (interface)
- `Meta` (type)
- `MultiDocument` (type)
- `MultiDocumentFromJson` (variable)
- `Never` (interface)
- `Null` (interface)
- `Number` (interface)
- `NumberMeta` (type)
- `ObjectKeyword` (interface)
- `Objects` (interface)
- `ObjectsMeta` (type)
- `PrimitiveTree` (type)
- `PropertySignature` (interface)
- `Reference` (interface)
- `References` (interface)
- `Representation` (type)
- `Reviver` (type)
- `SizeMeta` (type)
- `String` (interface)
- `StringMeta` (type)
- `Suspend` (interface)
- `Symbol` (interface)
- `TemplateLiteral` (interface)
- `TopologicalSort` (type)
- `Undefined` (interface)
- `Union` (interface)
- `UniqueSymbol` (interface)
- `Unknown` (interface)
- `Void` (interface)
