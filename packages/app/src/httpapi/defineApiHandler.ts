/**
 * Typed handler helper for HttpApi endpoint contracts.
 * Uses Router.Route from @typed/router (Router.Parse, Route.Join, etc.) for type-safe path/query.
 * Curried form: defineApiHandler(route, method, schemas?)(handler)
 * Handler receives { path, query, headers, body } for type-safe decoding;
 * error/success schemas encode response payloads into HttpServerResponse with annotated status codes.
 * Structural type checking: handler return must match success schema; errors must match error schema.
 *
 * @see .docs/specs/httpapi-virtual-module-plugin/spec.md (Typed handler helper)
 */

import type * as Effect from "effect/Effect";
import type * as Schema from "effect/Schema";
import type { HttpMethod as EffectHttpMethod } from "effect/unstable/http/HttpMethod";
import type * as Route from "@typed/router";

/** Re-export Effect HttpMethod for helper consumers. */
export type HttpMethod = EffectHttpMethod;

/** Typed empty record for path params and headers when none are defined. Used by emitted handler adapter. */
export const emptyRecordString: Record<string, string> = {};

/** Typed empty record for query params when none are defined. Used by emitted handler adapter. */
export const emptyRecordStringArray: Record<string, string | string[] | undefined> = {};

/** Route MUST be Router.Route (from Router.Parse, Route.Join, Route.Param, etc.). */
export type ApiRoute = Route.Route.Any;

/**
 * Infers handler params from endpoint contract. Use with handler:
 * handler: (params: ApiHandlerParams<{ route, method?, success?, error?, headers?, body? }>) => Effect
 */
export type ApiHandlerParams<
  T extends {
    readonly route: ApiRoute;
    readonly method: HttpMethod | "*";
    readonly success?: Schema.Schema<any>;
    readonly error?: Schema.Schema<any>;
    readonly headers?: Schema.Schema<any>;
    readonly body?: Schema.Schema<any>;
  },
> = {
  readonly path: Route.Route.PathType<T["route"]>;
  readonly query: Route.Route.QueryType<T["route"]>;
  readonly headers: T["headers"] extends Schema.Schema<infer H> ? H : Record<string, string>;
  readonly body: T["body"] extends Schema.Schema<infer B> ? B : unknown;
};

/**
 * Optional schemas: headers, body (request decoders); error, success (response encoders).
 * Use HttpApiSchema.status(code)(schema) to annotate status codes, e.g.:
 * success: HttpApiSchema.status(200)(Schema.Struct({ ok: Schema.Boolean }))
 * error: HttpApiSchema.status(400)(Schema.Struct({ message: Schema.String }))
 */
export interface EndpointSchemas<
  THeaders = unknown,
  TBody = unknown,
  TSuccess = unknown,
  TError = unknown,
> {
  readonly headers?: Schema.Schema<THeaders>;
  readonly body?: Schema.Schema<TBody>;
  readonly success?: Schema.Schema<TSuccess>;
  readonly error?: Schema.Schema<TError>;
}

/** Handler context: path params, query, headers, body (mirrors HttpServerRequest decoders). */
export interface ApiHandlerContext<
  TPath = Record<string, string>,
  TQuery = Record<string, string | string[] | undefined>,
  THeaders = Record<string, string>,
  TBody = unknown,
> {
  readonly path: TPath;
  readonly query: TQuery;
  readonly headers: THeaders;
  readonly body: TBody;
}

/** Handler function type: context -> Effect<Success, Error, Requirements> */
export type ApiHandlerFn<
  TPath = Record<string, string>,
  TQuery = Record<string, string | string[] | undefined>,
  THeaders = Record<string, string>,
  TBody = unknown,
  TSuccess = unknown,
  TError = unknown,
  Requirements = never,
> = (
  ctx: ApiHandlerContext<TPath, TQuery, THeaders, TBody>,
) => Effect.Effect<TSuccess, TError, Requirements>;

/** Typed handler as returned by defineApiHandler */
export type TypedApiHandler<
  TPath = Record<string, string>,
  TQuery = Record<string, string | string[] | undefined>,
  THeaders = Record<string, string>,
  TBody = unknown,
  TSuccess = unknown,
  TError = unknown,
  Requirements = never,
> = ApiHandlerFn<TPath, TQuery, THeaders, TBody, TSuccess, TError, Requirements>;

/**
 * Curried helper: (route, method, schemas?) => (handler) => typed handler.
 * Route MUST be Router.Route (Router.Parse, Route.Join, Route.Param, etc.).
 * Enforces at compile time that the handler receives { path, query, headers, body }
 * and returns Effect<Success, Error> compatible with success/error schemas.
 */
export function defineApiHandler<
  TRoute extends ApiRoute,
  Method extends HttpMethod,
  THeaders = Record<string, string>,
  TBody = unknown,
  TSuccess = unknown,
  TError = unknown,
>(
  _route: TRoute,
  _method: Method,
  _schemas?: EndpointSchemas<THeaders, TBody, TSuccess, TError>,
): <Requirements = never>(
  handler: ApiHandlerFn<
    Route.Route.PathType<TRoute>,
    Route.Route.QueryType<TRoute>,
    THeaders,
    TBody,
    TSuccess,
    TError,
    Requirements
  >,
) => TypedApiHandler<
  Route.Route.PathType<TRoute>,
  Route.Route.QueryType<TRoute>,
  THeaders,
  TBody,
  TSuccess,
  TError,
  Requirements
> {
  return (handler) => handler;
}
