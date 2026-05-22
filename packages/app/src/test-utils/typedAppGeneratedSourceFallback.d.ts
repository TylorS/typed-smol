declare module "@typed/app" {
  import type * as Effect from "effect/Effect";
  import type * as Layer from "effect/Layer";

  export const emptyRecordString: Readonly<Record<string, string>>;
  export const emptyRecordStringArray: Readonly<
    Record<string, string | readonly string[] | undefined>
  >;

  export interface AppConfig {
    readonly disableListenLog?: boolean;
  }

  export interface RunConfig extends AppConfig {
    readonly host?: string | Effect.Effect<string>;
    readonly port?: number | Effect.Effect<number>;
  }

  export type LayerAny = Layer.Layer<never, any, any>;
  export type LayerOrGroup = LayerAny | readonly [LayerAny, ...ReadonlyArray<LayerAny>];

  export type ComputeLayers<
    Layers extends ReadonlyArray<LayerOrGroup>,
    R extends LayerAny,
  > = readonly [] extends Layers
    ? R
    : Layers extends readonly [
          infer Head extends LayerOrGroup,
          ...infer Tail extends ReadonlyArray<LayerOrGroup>,
        ]
      ? ComputeLayers<Tail, ProvideMerge<R, ComputeLayer<Head>>>
      : R;

  export type ProvideMerge<A extends LayerAny, B extends LayerAny> = Layer.Layer<
    Layer.Success<A | B>,
    Layer.Error<A | B>,
    Exclude<Layer.Services<A>, Layer.Success<B>> | Layer.Services<B>
  >;

  type ComputeLayer<L extends LayerOrGroup> =
    L extends Layer.Layer<infer A, infer E, infer R>
      ? Layer.Layer<A, E, R>
      : L extends ReadonlyArray<Layer.Layer<infer A, infer E, infer R>>
        ? Layer.Layer<A, E, R>
        : never;

  export function composeWithLayers<
    Base extends LayerAny,
    const Layers extends ReadonlyArray<LayerOrGroup>,
  >(base: Base, layers: Layers): ComputeLayers<Layers, Base>;

  export function resolveConfig<A>(
    value: A | Effect.Effect<A> | undefined,
    fallback: A,
  ): Effect.Effect<A>;

  export const TypedHttpServer: {
    readonly staticAssets: (options: {
      readonly projectRoot: string;
      readonly buildOutDir?: string;
      readonly clientOutDir?: string;
      readonly dev: boolean;
    }) => Layer.Layer<never, never, never>;
    readonly layer: (options: {
      readonly projectRoot: string;
      readonly dev: boolean;
      readonly host?: string;
      readonly port?: number;
    }) => LayerAny;
    readonly toNodeHandler: (layer: LayerAny) => unknown;
  };

  export const RouteHandlers: {
    readonly apply: (matcher: any, handlers: any) => any;
  };
}

declare module "@typed/app/httpapi/ApiHandler" {
  import type * as Effect from "effect/Effect";
  import type * as Schema from "effect/Schema";
  import type { HttpServerResponse } from "effect/unstable/http/HttpServerResponse";
  import type * as Route from "@typed/router";

  export const emptyRecordString: Readonly<Record<string, string>>;
  export const emptyRecordStringArray: Readonly<
    Record<string, string | readonly string[] | undefined>
  >;

  export type ApiRoute = Route.Route.Any;
  export type ApiEndpointConfig = {
    readonly route: ApiRoute;
    readonly method: string;
    readonly success?: Schema.Top;
    readonly error?: Schema.Top;
    readonly headers?: Schema.Top & { Type: Record<string, string> };
    readonly body?: Schema.Top;
  };
  export type ApiHandlerParamsFromConfig<C extends ApiEndpointConfig> = {
    readonly path: Route.Route.PathType<C["route"]>;
    readonly query: Route.Route.QueryType<C["route"]>;
    readonly headers: C["headers"] extends Schema.Top
      ? C["headers"]["Type"]
      : Record<string, string>;
    readonly body: C["body"] extends Schema.Top ? C["body"]["Type"] : unknown;
  };
  export type ApiHandlerSuccessFromConfig<C extends ApiEndpointConfig> = C extends {
    readonly success: infer Success;
  }
    ? Success extends { readonly Type: infer A }
      ? A
      : unknown
    : unknown;
  export type ApiHandlerErrorFromConfig<C extends ApiEndpointConfig> = C extends {
    readonly error: infer Error;
  }
    ? Error extends { readonly Type: infer A }
      ? A
      : never
    : never;
  export type ApiHandlerFromConfig<C extends ApiEndpointConfig, R = any> = (
    params: ApiHandlerParamsFromConfig<C>,
  ) => Effect.Effect<ApiHandlerSuccessFromConfig<C>, ApiHandlerErrorFromConfig<C>, R>;
  export type ApiHandlerRawFromConfig<C extends ApiEndpointConfig, R = any> = (
    params: ApiHandlerParamsFromConfig<C>,
  ) => Effect.Effect<HttpServerResponse, ApiHandlerErrorFromConfig<C>, R>;
}

declare module "@typed/app/httpapi/Handlers" {
  export const ApiHandlers: {
    readonly handle: (handlers: any, name: string, endpoint: any, options?: any) => any;
    readonly handler: (endpoint: any, options?: any) => any;
    readonly handleRaw: (handlers: any, name: string, endpoint: any, options?: any) => any;
  };
}

declare module "@typed/app/runtime" {
  import type * as Layer from "effect/Layer";

  export type LayerAny = Layer.Layer<never, any, any>;
  export type LayerOrGroup = LayerAny | readonly [LayerAny, ...ReadonlyArray<LayerAny>];
  export const Ids: { readonly Default: Layer.Layer<never, never, never> };

  export function composeWithLayers<
    Base extends LayerAny,
    const Layers extends ReadonlyArray<LayerOrGroup>,
  >(base: Base, layers: Layers): LayerAny;
}

declare module "@typed/app/internal/resolveConfig" {
  import type * as Effect from "effect/Effect";

  export function resolveConfig<A>(
    value: A | Effect.Effect<A> | undefined,
    fallback: A,
  ): Effect.Effect<A>;
}

declare module "@typed/app/TypedHttpServer" {
  import type * as Layer from "effect/Layer";

  export type LayerAny = Layer.Layer<never, any, any>;

  export const TypedHttpServer: {
    readonly staticAssets: (options: {
      readonly projectRoot: string;
      readonly buildOutDir?: string;
      readonly clientOutDir?: string;
      readonly dev: boolean;
    }) => Layer.Layer<never, never, never>;
    readonly layer: (options: {
      readonly projectRoot: string;
      readonly dev: boolean;
      readonly host?: string;
      readonly port?: number;
    }) => LayerAny;
    readonly toNodeHandler: (layer: LayerAny) => unknown;
  };
}

declare module "@typed/app/RouteHandlers" {
  export const apply: (matcher: any, handlers: any) => any;
}
