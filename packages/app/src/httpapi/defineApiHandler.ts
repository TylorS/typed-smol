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
import { Types } from "effect";
import { HttpServerError } from "effect/unstable/http";

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
 * Supports both Schema.Top (schema types with .Type) and Schema.Schema<infer H> for headers/body.
 */
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

/**
 * Optional schemas: headers, body (request decoders); error, success (response encoders).
 * Type params extend Schema.Top; use .Type for decoded types.
 * Use HttpApiSchema.status(code)(schema) to annotate status codes, e.g.:
 * success: HttpApiSchema.status(200)(Schema.Struct({ ok: Schema.Boolean }))
 * error: HttpApiSchema.status(400)(Schema.Struct({ message: Schema.String }))
 */
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

/** When T is never (no schema), use default so emitted adapter (headers/body) is assignable. */
type HeadersOrDefault<T> = [T] extends [never]
  ? Record<string, string>
  : T extends { Type: infer H }
    ? H
    : Record<string, string>;
/** When T is never (no schema), use unknown so emitted adapter (body: undefined) is assignable. */
type BodyOrDefault<T> = [T] extends [never] ? unknown : T extends { Type: infer B } ? B : unknown;

/** Handler context: path params, query, headers, body (mirrors HttpServerRequest decoders). */
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

/** Handler function type: context -> Effect<Success, Error, Requirements> */
export type ApiHandlerFn<
  C extends ApiHandlerContext<any, any, any, any>,
  TSuccess = unknown,
  TError = unknown,
  Requirements = never,
> = (ctx: C) => Effect.Effect<TSuccess, TError | HttpServerError.HttpServerError, Requirements>;

/** Typed handler as returned by defineApiHandler */
export type TypedApiHandler<
  C extends ApiHandlerContext<any, any, any, any>,
  TSuccess = unknown,
  TError = unknown,
  Requirements = never,
> = ApiHandlerFn<C, TSuccess, TError, Requirements>;

/**
 * defineApiHandler(route, method, schemas?)(handler) — params from schemas (.Type); handler return Effect<TSuccess['Type'], TError['Type'], R>.
 * Route MUST be Router.Route (Router.Parse, Route.Join, Route.Param, etc.).
 */
export function ApiHandler<
  TRoute extends ApiRoute,
  THeaders extends Schema.Top & { Type: Record<string, string> } = never,
  TBody extends Schema.Top = never,
  TSuccess extends Schema.Top = never,
  TError extends Schema.Top = never,
>(
  _route: TRoute,
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
