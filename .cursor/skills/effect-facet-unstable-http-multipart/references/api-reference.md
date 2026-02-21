# API Reference: effect/unstable/http/Multipart

- Import path: `effect/unstable/http/Multipart`
- Source file: `packages/effect/src/unstable/http/Multipart.ts`
- Function exports (callable): 11
- Non-function exports: 16

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `collectUint8Array`
- `isField`
- `isFile`
- `isPart`
- `isPersistedFile`
- `limitsServices`
- `makeChannel`
- `makeConfig`
- `schemaJson`
- `schemaPersisted`
- `toPersisted`

## All Function Signatures

```ts
export declare const collectUint8Array: <OE, OD, R>(self: Channel.Channel<Arr.NonEmptyReadonlyArray<Uint8Array>, OE, OD, unknown, unknown, unknown, R>): Effect.Effect<Uint8Array<ArrayBuffer>, OE, R>;
export declare const isField: (u: unknown): u is Field;
export declare const isFile: (u: unknown): u is File;
export declare const isPart: (u: unknown): u is Part;
export declare const isPersistedFile: (u: unknown): u is PersistedFile;
export declare const limitsServices: (options: { readonly maxParts?: number | undefined; readonly maxFieldSize?: FileSystem.SizeInput | undefined; readonly maxFileSize?: FileSystem.SizeInput | undefined; readonly maxTotalSize?: FileSystem.SizeInput | undefined; readonly fieldMimeTypes?: ReadonlyArray<string> | undefined; }): ServiceMap.ServiceMap<never>;
export declare const makeChannel: <IE>(headers: Record<string, string>): Channel.Channel<Arr.NonEmptyReadonlyArray<Part>, MultipartError | IE, void, Arr.NonEmptyReadonlyArray<Uint8Array>, IE, unknown>;
export declare const makeConfig: (headers: Record<string, string>): Effect.Effect<MP.BaseConfig>;
export declare const schemaJson: <A, I, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined): { (field: string): (persisted: Persisted) => Effect.Effect<A, Schema.SchemaError, RD>; (persisted: Persisted, field: string): Effect.Effect<A, Schema.SchemaError, RD>; };
export declare const schemaPersisted: <A, I extends Partial<Persisted>, RD, RE>(schema: Schema.Codec<A, I, RD, RE>): (input: unknown, options?: ParseOptions) => Effect.Effect<A, Schema.SchemaError, RD>;
export declare const toPersisted: (stream: Stream.Stream<Part, MultipartError>, writeFile?: (path: string, file: File) => Effect.Effect<void, MultipartError, FileSystem.FileSystem>): Effect.Effect<Persisted, MultipartError, FileSystem.FileSystem | Path.Path | Scope.Scope>;
```

## Other Exports (Non-Function)

- `Field` (interface)
- `FieldMimeTypes` (variable)
- `File` (interface)
- `FilesSchema` (variable)
- `MaxFieldSize` (variable)
- `MaxFileSize` (variable)
- `MaxParts` (variable)
- `MultipartError` (class)
- `MultipartErrorReason` (class)
- `Part` (type)
- `Persisted` (interface)
- `PersistedFile` (interface)
- `PersistedFileSchema` (interface)
- `SingleFileSchema` (variable)
- `TypeId` (variable)
- `withLimits` (namespace)
