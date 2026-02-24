/**
 * HttpApi endpoint: route contract for api:./api virtual module.
 * Exports route (Router.Route), method, optional headers/body/error/success, handler.
 * ApiHandlerParams infers path/query types from route; error/success use HttpApiSchema.status(code).
 */
import type { ApiHandlerParams } from "@typed/app";
import * as Effect from "effect/Effect";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import * as Schema from "effect/Schema";
import * as Router from "@typed/router";

export const route = Router.Join(Router.Parse("/user"), Router.Param("id"))
export const method = "GET";

export const success = HttpApiSchema.status(200)(Schema.Struct({ status: Schema.Literal("ok") }));
export const error = HttpApiSchema.status(400)(Schema.Struct({ message: Schema.String }));

export const handler = ({
  path,
  query,
  headers,
  body,
}: ApiHandlerParams<{
  route: typeof route;
  method: typeof method;
  success: typeof success;
  error: typeof error;
}>) => Effect.succeed({ status: "ok" as const });
