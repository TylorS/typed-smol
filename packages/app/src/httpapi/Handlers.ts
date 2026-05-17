import * as Effect from "effect/Effect";
import * as HttpIncomingMessage from "effect/unstable/http/HttpIncomingMessage";
import { emptyRecordString, emptyRecordStringArray } from "./ApiHandler.js";

export type ApiHandlerBodyMode = "empty" | "payload" | "json";

export interface ApiHandlerBindingOptions {
  readonly body?: ApiHandlerBodyMode;
}

export interface ApiEndpointModule {
  readonly body?: any;
  readonly handler: (params: ApiEndpointParams) => Effect.Effect<any, any, any>;
}

export interface ApiEndpointParams {
  readonly path: Record<string, string>;
  readonly query: Record<string, string | readonly string[] | undefined>;
  readonly headers: Record<string, string>;
  readonly body: any;
}

export interface ApiEndpointHandlerBuilder<Self> {
  readonly handle: (name: string, handler: (ctx: any) => Effect.Effect<any, any, any>) => Self;
  readonly handleRaw: (name: string, handler: (ctx: any) => Effect.Effect<any, any, any>) => Self;
}

export function handle<Handlers extends ApiEndpointHandlerBuilder<Handlers>>(
  handlers: Handlers,
  name: string,
  endpoint: ApiEndpointModule,
  options: ApiHandlerBindingOptions = {},
): Handlers {
  return handlers.handle(name, (ctx) => call(endpoint, ctx, options));
}

export function handleRaw<Handlers extends ApiEndpointHandlerBuilder<Handlers>>(
  handlers: Handlers,
  name: string,
  endpoint: ApiEndpointModule,
  options: ApiHandlerBindingOptions = {},
): Handlers {
  return handlers.handleRaw(name, (ctx) => {
    if (options.body !== "json") return call(endpoint, ctx, options);

    return Effect.flatMap(
      Effect.orDie(HttpIncomingMessage.schemaBodyJson(endpoint.body)(ctx.request)),
      (body) => call(endpoint, ctx, options, body),
    );
  });
}

export const ApiHandlers = {
  handle,
  handleRaw,
};

function call(
  endpoint: ApiEndpointModule,
  ctx: any,
  options: ApiHandlerBindingOptions,
  decodedBody?: any,
): Effect.Effect<any, any, any> {
  return endpoint.handler({
    path: ctx.params ?? emptyRecordString,
    query: ctx.query ?? emptyRecordStringArray,
    headers: ctx.headers ?? ctx.request?.headers ?? emptyRecordString,
    body: bodyFromContext(ctx, options, decodedBody),
  });
}

function bodyFromContext(ctx: any, options: ApiHandlerBindingOptions, decodedBody?: any): any {
  if (options.body === "json") return decodedBody;
  if (options.body === "payload") return ctx.payload;
  return undefined;
}
