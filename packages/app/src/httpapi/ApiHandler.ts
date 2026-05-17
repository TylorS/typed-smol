/**
 * Typed constructors for HttpApi endpoint handlers.
 *
 * ApiHandler(route, method, schemas?)(handler) constrains endpoint params plus
 * success/error schemas.
 * ApiHandlerRaw(config)(handler) lets handlers return HttpServerResponse.
 */

import type * as Effect from "effect/Effect";
import type * as Schema from "effect/Schema";
import type { HttpMethod as EffectHttpMethod } from "effect/unstable/http/HttpMethod";
import { HttpServerError } from "effect/unstable/http";
import type { HttpServerResponse } from "effect/unstable/http/HttpServerResponse";
import { Types } from "effect";
import type * as Route from "@typed/router";

export type HttpMethod = EffectHttpMethod;

/** Typed empty record for path params and headers when none are defined. */
export const emptyRecordString: Record<string, string> = {};

/** Typed empty record for query params when none are defined. */
export const emptyRecordStringArray: Record<string, string | string[] | undefined> = {};

export type ApiRoute = Route.Route.Any;

export type ApiHandlerParams<
  T extends {
    readonly route: ApiRoute;
    readonly method: HttpMethod | "*";
    readonly success?: Schema.Schema<any> | Schema.Top;
    readonly error?: Schema.Schema<any> | Schema.Top;
    readonly headers?: Schema.Schema<any> | (Schema.Top & { Type: Record<string, string> });
    readonly body?: Schema.Schema<any> | Schema.Top;
  },
> = {
  readonly path: Route.Route.PathType<T["route"]>;
  readonly query: Route.Route.QueryType<T["route"]>;
  readonly headers: T["headers"] extends Schema.Top
    ? T["headers"]["Type"]
    : T["headers"] extends Schema.Schema<infer H>
      ? H
      : Record<string, string>;
  readonly body: T["body"] extends Schema.Top
    ? T["body"]["Type"]
    : T["body"] extends Schema.Schema<infer B>
      ? B
      : unknown;
};

export type EndpointSchemas<
  THeaders extends Schema.Top & { Type: Record<string, string> } = never,
  TBody extends Schema.Top = never,
  TSuccess extends Schema.Top = never,
  TError extends Schema.Top = never,
> = {
  readonly headers?: THeaders;
  readonly body?: TBody;
  readonly success?: TSuccess;
  readonly error?: TError;
};

type HeadersOrDefault<T> = [T] extends [never]
  ? Record<string, string>
  : T extends { Type: infer H }
    ? H
    : Record<string, string>;

type BodyOrDefault<T> = [T] extends [never] ? unknown : T extends { Type: infer B } ? B : unknown;

export type ApiHandlerContext<
  TPath extends Record<string, string>,
  TQuery extends Record<string, string | string[] | undefined> = never,
  THeaders extends Record<string, string> = never,
  TBody = unknown,
> = Types.Simplify<
  ([keyof TPath] extends [never] ? { path?: {} } : { readonly path: TPath }) &
    ([keyof TQuery] extends [never] ? { query?: {} } : { readonly query: TQuery }) &
    ([THeaders] extends [never]
      ? { headers?: {} }
      : [keyof THeaders] extends [never]
        ? { headers?: {} }
        : { readonly headers: THeaders }) &
    ([TBody] extends [never] ? { readonly body?: unknown } : { readonly body: TBody })
>;

export type ApiHandlerFn<
  C extends ApiHandlerContext<any, any, any, any>,
  TSuccess = unknown,
  TError = unknown,
  Requirements = never,
> = (ctx: C) => Effect.Effect<TSuccess, TError | HttpServerError.HttpServerError, Requirements>;

export type TypedApiHandler<
  C extends ApiHandlerContext<any, any, any, any>,
  TSuccess = unknown,
  TError = unknown,
  Requirements = never,
> = ApiHandlerFn<C, TSuccess, TError, Requirements>;

export function ApiHandler<
  TRoute extends ApiRoute,
  Method extends HttpMethod,
  THeaders extends Schema.Top & { Type: Record<string, string> } = never,
  TBody extends Schema.Top = never,
  TSuccess extends Schema.Top = never,
  TError extends Schema.Top = never,
>(
  _route: TRoute,
  _method: Method,
  _schemas?: EndpointSchemas<THeaders, TBody, TSuccess, TError>,
): <R = never>(
  handler: ApiHandlerFn<
    {
      path: Route.Route.PathType<TRoute>;
      query: Route.Route.QueryType<TRoute>;
      headers: HeadersOrDefault<THeaders>;
      body: BodyOrDefault<TBody>;
    },
    TSuccess["Type"],
    TError["Type"],
    R
  >,
) => TypedApiHandler<
  {
    path: Route.Route.PathType<TRoute>;
    query: Route.Route.QueryType<TRoute>;
    headers: HeadersOrDefault<THeaders>;
    body: BodyOrDefault<TBody>;
  },
  TSuccess["Type"],
  TError["Type"],
  R
> {
  return (handler) => handler;
}

type RawConfigWithRoute = {
  readonly route: ApiRoute;
  readonly headers?: Schema.Top & { Type: Record<string, string> };
  readonly body?: Schema.Top;
};

export type ApiHandlerParamsFromConfig<C extends RawConfigWithRoute> = Types.Simplify<
  ApiHandlerContext<
    Route.Route.PathType<C["route"]>,
    Route.Route.QueryType<C["route"]>,
    C["headers"] extends Schema.Top ? C["headers"]["Type"] : never,
    C["body"] extends Schema.Top ? C["body"]["Type"] : never
  >
>;

export type ApiHandlerRawConfig<
  TRoute extends ApiRoute = ApiRoute,
  Method extends HttpMethod = HttpMethod,
  THeaders extends Schema.Top & { Type: Record<string, string> } = never,
  TBody extends Schema.Top = never,
> = {
  readonly route: TRoute;
  readonly method: Method;
  readonly headers?: THeaders;
  readonly body?: TBody;
};

export function ApiHandlerRaw<C extends ApiHandlerRawConfig<any, any, any, any>>(
  _config: C,
): <TError = never, R = never>(
  handler: (params: ApiHandlerParamsFromConfig<C>) => Effect.Effect<HttpServerResponse, TError, R>,
) => (params: ApiHandlerParamsFromConfig<C>) => Effect.Effect<HttpServerResponse, TError, R> {
  return (handler) => handler;
}
