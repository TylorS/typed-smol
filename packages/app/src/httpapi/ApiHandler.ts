/**
 * Typed constructors for HttpApi endpoint handlers.
 * Handler shape: (params: from-config) => Effect<TSuccess, TError, R>. Params = { path, query, headers, body } from config.
 *
 * ApiHandler(config)(handler) — success/error schemas constrain handler return.
 * ApiHandlerRaw(config)(handler) — handler returns HttpServerResponse (full response ownership).
 */

import type * as Effect from "effect/Effect";
import type * as Schema from "effect/Schema";
import type { HttpMethod } from "./defineApiHandler.js";
import type { ApiHandlerContext } from "./defineApiHandler.js";
import type { ApiRoute } from "./defineApiHandler.js";
import type * as Route from "@typed/router";
import type { HttpServerResponse } from "effect/unstable/http/HttpServerResponse";
import { Types } from "effect";

/** Config shape with route and optional headers/body (shared by ApiHandler and ApiHandlerRaw). */
type ConfigWithRoute = {
  readonly route: ApiRoute;
  readonly headers?: Schema.Top & { Type: Record<string, string> };
  readonly body?: Schema.Top;
};

/** Params type from config (route + optional headers/body). */
export type ApiHandlerParamsFromConfig<C extends ConfigWithRoute> = Types.Simplify<
  ApiHandlerContext<
    Route.Route.PathType<C["route"]>,
    Route.Route.QueryType<C["route"]>,
    C["headers"] extends Schema.Top ? C["headers"]["Type"] : never,
    C["body"] extends Schema.Top ? C["body"]["Type"] : never
  >
>;

/** Success type from ApiHandler config (success schema .Type or unknown). */
type SuccessFromConfig<C extends ApiHandlerConfig<any, any, any, any, any>> =
  C["success"] extends Schema.Top ? C["success"]["Type"] : unknown;

/** Error type from ApiHandler config (error schema .Type or unknown). */
type ErrorFromConfig<C extends ApiHandlerConfig<any, any, any, any, any>> =
  C["error"] extends Schema.Top ? C["error"]["Type"] : never;

/** ApiHandler config: route, method, optional headers/body/success/error schemas. */
export type ApiHandlerConfig<
  TRoute extends ApiRoute,
  THeaders extends Schema.Top & { Type: Record<string, string> } = never,
  TBody extends Schema.Top = never,
  TSuccess extends Schema.Top = never,
  TError extends Schema.Top = never,
> = DropNever<{
  readonly route: TRoute;
  readonly headers?: THeaders;
  readonly body?: TBody;
  readonly success?: TSuccess;
  readonly error?: TError;
}>;

type DropNever<T> = {
  readonly [K in keyof T as [T[K]] extends [never] ? never : K]: T[K];
};

/** ApiHandlerRaw config: route, method, optional headers/body; no success/error. */
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

/** ApiHandler(config)(handler) — params from config; handler return Effect<TSuccess, TError, R> */
export function ApiHandler<C extends ApiHandlerConfig<any, any, any, any, any>>(
  _config: C,
): <A extends SuccessFromConfig<C>, E extends ErrorFromConfig<C>, R = never>(
  handler: (params: ApiHandlerParamsFromConfig<C>) => Effect.Effect<A, E, R>,
) => (params: ApiHandlerParamsFromConfig<C>) => Effect.Effect<A, E, R> {
  return (handler) => handler;
}

/** ApiHandlerRaw(config)(handler) — params from config; handler return Effect<HttpServerResponse, TError, R> */
export function ApiHandlerRaw<C extends ApiHandlerRawConfig<any, any, any, any>>(
  _config: C,
): <TError extends ErrorFromConfig<C>, R = never>(
  handler: (params: ApiHandlerParamsFromConfig<C>) => Effect.Effect<HttpServerResponse, TError, R>,
) => (params: ApiHandlerParamsFromConfig<C>) => Effect.Effect<HttpServerResponse, TError, R> {
  return (handler) => handler;
}
