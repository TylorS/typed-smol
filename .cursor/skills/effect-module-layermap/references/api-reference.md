# API Reference: effect/LayerMap

- Import path: `effect/LayerMap`
- Source file: `packages/effect/src/LayerMap.ts`
- Function exports (callable): 3
- Non-function exports: 2

## Purpose

Module-specific APIs and usage patterns for Effect programs.

## Key Function Exports

- `fromRecord`
- `make`
- `Service`

## All Function Signatures

```ts
export declare const fromRecord: <const Layers extends Record<string, Layer.Layer<any, any, any>>, const Preload extends boolean = false>(layers: Layers, options?: { readonly idleTimeToLive?: Duration.Input | undefined; readonly preload?: Preload | undefined; } | undefined): Effect.Effect<LayerMap<keyof Layers, Layer.Success<Layers[keyof Layers]>, Layer.Error<Layers[keyof Layers]>>, Preload extends true ? Layer.Error<Layers[keyof Layers]> : never, Scope.Scope | (Layers[keyof Layers] extends Layer.Layer<infer _A, infer _E, infer _R> ? _R : never)>;
export declare const make: <K, L extends Layer.Layer<any, any, any>, PreloadKeys extends Iterable<K> | undefined = undefined>(lookup: (key: K) => L, options?: { readonly idleTimeToLive?: Duration.Input | undefined; readonly preloadKeys?: PreloadKeys; } | undefined): Effect.Effect<LayerMap<K, Layer.Success<L>, Layer.Error<L>>, PreloadKeys extends undefined ? never : Layer.Error<L>, Scope.Scope | Layer.Services<L>>;
export declare const Service: <Self>(): <const Id extends string, const Options extends NoExcessProperties<{ readonly lookup: (key: any) => Layer.Layer<any, any, any>; readonly dependencies?: ReadonlyArray<Layer.Layer<any, any, any>> | undefined; readonly idleTimeToLive?: Duration.Input | undefined; readonly preloadKeys?: Iterable<Options extends { readonly lookup: (key: infer K) => any; } ? K : never> | undefined; }, Options> | NoExcessProperties<{ readonly layers: Record<string, Layer.Layer<any, any, any>>; readonly dependencies?: ReadonlyArray<Layer.Layer<any, any, any>> | undefined; readonly idleTimeToLive?: Duration.Input | undefined; readonly preload?: boolean | undefined; }, Options>>(id: Id, options: Options) => TagClass<Self, Id, Options extends { readonly lookup: (key: infer K) => any; } ? K : Options extends { readonly layers: infer Layers; } ? keyof Layers : never, Service.Success<Options>, Options extends { readonly preload: true; } ? never : Service.Error<Options>, Service.Services<Options>, Options extends { readonly preload: true; } ? Service.Error<Options> : Options extends { readonly preloadKeys: Iterable<any>; } ? Service.Error<Options> : never, Options extends { readonly dependencies: ReadonlyArray<Layer.Layer<any, any, any>>; } ? Options["dependencies"][number] : never>;
```

## Other Exports (Non-Function)

- `LayerMap` (interface)
- `TagClass` (interface)
