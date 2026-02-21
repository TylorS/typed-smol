# API Reference: effect/unstable/rpc/Rpc

- Import path: `effect/unstable/rpc/Rpc`
- Source file: `packages/effect/src/unstable/rpc/Rpc.ts`
- Function exports (callable): 7
- Non-function exports: 36

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `exitSchema`
- `fork`
- `isRpc`
- `isWrapper`
- `make`
- `uninterruptible`
- `wrap`

## All Function Signatures

```ts
export declare const exitSchema: <R extends Any>(self: R): Schema.Exit<SuccessExitSchema<R>, ErrorExitSchema<R>, DefectSchema>;
export declare const fork: <A extends object>(value: A): Wrapper<A>;
export declare const isRpc: (u: unknown): u is Rpc<any, any, any>;
export declare const isWrapper: (u: object): u is Wrapper<any>;
export declare const make: <const Tag extends string, Payload extends Schema.Top | Schema.Struct.Fields = Schema.Void, Success extends Schema.Top = Schema.Void, Error extends Schema.Top = Schema.Never, const Stream extends boolean = false>(tag: Tag, options?: { readonly payload?: Payload; readonly success?: Success; readonly error?: Error; readonly defect?: DefectSchema; readonly stream?: Stream; readonly primaryKey?: [Payload] extends [Schema.Struct.Fields] ? ((payload: Payload extends Schema.Struct.Fields ? Struct.Simplify<Schema.Struct<Payload>["Type"]> : Payload["Type"]) => string) : never; }): Rpc<Tag, Payload extends Schema.Struct.Fields ? Schema.Struct<Payload> : Payload, Stream extends true ? RpcSchema.Stream<Success, Error> : Success, Stream extends true ? typeof Schema.Never : Error>;
export declare const uninterruptible: <A extends object>(value: A): Wrapper<A>;
export declare const wrap: (options: { readonly fork?: boolean | undefined; readonly uninterruptible?: boolean | undefined; }): <A extends object>(value: A) => Wrapper<A>;
```

## Other Exports (Non-Function)

- `AddError` (type)
- `AddMiddleware` (type)
- `Any` (interface)
- `AnyWithProps` (interface)
- `DefectSchema` (interface)
- `Error` (type)
- `ErrorExit` (type)
- `ErrorExitSchema` (type)
- `ErrorSchema` (type)
- `ExcludeProvides` (type)
- `Exit` (type)
- `ExtractProvides` (type)
- `ExtractRequires` (type)
- `ExtractTag` (type)
- `Handler` (interface)
- `IsStream` (type)
- `Middleware` (type)
- `MiddlewareClient` (type)
- `Payload` (type)
- `PayloadConstructor` (type)
- `Prefixed` (type)
- `ResultFrom` (type)
- `Rpc` (interface)
- `Services` (type)
- `ServicesClient` (type)
- `ServicesServer` (type)
- `Success` (type)
- `SuccessChunk` (type)
- `SuccessEncoded` (type)
- `SuccessExit` (type)
- `SuccessExitSchema` (type)
- `SuccessSchema` (type)
- `Tag` (type)
- `ToHandler` (type)
- `ToHandlerFn` (type)
- `Wrapper` (interface)
