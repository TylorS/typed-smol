import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as HttpIncomingMessage from "effect/unstable/http/HttpIncomingMessage";
import type * as HttpServerError from "effect/unstable/http/HttpServerError";
import { emptyRecordString, emptyRecordStringArray } from "./ApiHandler.js";

export type ApiHandlerBodyMode = "empty" | "payload" | "json";

export interface ApiHandlerBindingOptions {
  readonly body?: ApiHandlerBodyMode;
}

export interface ApiEndpointModule<A = unknown, E = never, R = never, Body extends Schema.Top = Schema.Top> {
  readonly body?: Body;
  readonly handler: (params: any) => Effect.Effect<A, E, R>;
}

export interface ApiEndpointParams {
  readonly path: any;
  readonly query: any;
  readonly headers: any;
  readonly body: unknown;
}

export interface ApiEndpointRuntimeContext {
  readonly params?: any;
  readonly query?: any;
  readonly headers?: any;
  readonly payload?: unknown;
  readonly request?: HttpIncomingMessage.HttpIncomingMessage<HttpServerError.HttpServerError>;
}

export function handle<Handlers, const Name extends string, A, E, R, Out>(
  handlers: Handlers & {
    readonly handle: (
      name: Name,
      handler: (ctx: ApiEndpointRuntimeContext) => Effect.Effect<A, E, R>,
    ) => Out;
  },
  name: Name,
  endpoint: ApiEndpointModule<A, E, R>,
  options: ApiHandlerBindingOptions = {},
): Out {
  return handlers.handle(name, (ctx) => call(endpoint, ctx, options));
}

export function handler<A, E, R>(
  endpoint: ApiEndpointModule<A, E, R>,
  options: ApiHandlerBindingOptions = {},
): (ctx: ApiEndpointRuntimeContext) => Effect.Effect<A, E, R> {
  return (ctx) => call(endpoint, ctx, options);
}

export function rawHandler<A, E, R, Body extends Schema.Top>(
  endpoint: ApiEndpointModule<A, E, R, Body>,
  options: ApiHandlerBindingOptions = {},
): (ctx: ApiEndpointRuntimeContext) => Effect.Effect<A, E, R | Body["DecodingServices"]> {
  return (ctx) => {
    if (options.body !== "json") return call(endpoint, ctx, options);
    if (!ctx.request) return call(endpoint, ctx, options);
    if (!endpoint.body) return call(endpoint, ctx, options);

    return HttpIncomingMessage.schemaBodyJson(endpoint.body)(ctx.request).pipe(
      Effect.orDie,
      Effect.flatMap((body) => call(endpoint, ctx, options, body)),
    );
  };
}

export function rawJsonBody<Body extends Schema.Top, E>(
  body: Body,
  request: HttpIncomingMessage.HttpIncomingMessage<E>,
): Effect.Effect<Body["Type"], never, E | Body["DecodingServices"]> {
  return HttpIncomingMessage.schemaBodyJson(body)(request).pipe(Effect.orDie);
}

export const ApiHandlers = {
  handle,
  handler,
  rawHandler,
  rawJsonBody,
};

function call<A, E, R>(
  endpoint: ApiEndpointModule<A, E, R>,
  ctx: ApiEndpointRuntimeContext,
  options: ApiHandlerBindingOptions,
  decodedBody?: unknown,
): Effect.Effect<A, E, R> {
  return endpoint.handler({
    path: ctx.params ?? emptyRecordString,
    query: ctx.query ?? emptyRecordStringArray,
    headers: ctx.headers ?? requestHeaders(ctx.request) ?? emptyRecordString,
    body: bodyFromContext(ctx, options, decodedBody),
  });
}

function bodyFromContext(
  ctx: ApiEndpointRuntimeContext,
  options: ApiHandlerBindingOptions,
  decodedBody?: unknown,
): unknown {
  if (options.body === "json") return decodedBody;
  if (options.body === "payload") return ctx.payload;
  return undefined;
}

function requestHeaders(
  request: ApiEndpointRuntimeContext["request"],
): Record<string, string> | undefined {
  return request?.headers;
}
