/**
 * HttpApi endpoint: route contract for api:./api virtual module.
 * Exports route (Router.Route), method, optional headers/body/error/success, handler.
 * defineApiHandler(route, method, schemas)(handler) infers path/query and success/error types.
 */
import { ApiHandler } from "@typed/app";
import * as Effect from "effect/Effect";
import * as HttpApiSchema from "effect/unstable/httpapi/HttpApiSchema";
import * as Schema from "effect/Schema";
import * as Router from "@typed/router";

export const route = Router.Join(Router.Parse("/user"), Router.Param("id"));
export const method = "GET";

export const success = HttpApiSchema.status(200)(Schema.Struct({ status: Schema.tag("ok") }));
export const error = HttpApiSchema.status(400)(Schema.Struct({ message: Schema.String }));

export const handler = ApiHandler({ route, success, error })(() =>
  Effect.succeed(success.makeUnsafe({})),
);
