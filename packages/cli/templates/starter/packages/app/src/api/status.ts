import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { ApiHandler } from "@typed/app/httpapi/ApiHandler";
import { message } from "@__APP_NAME__/shared";

export const route = Route.Parse("status");
export const method = "GET";
export const handler = ApiHandler(route, method)(() => Effect.succeed({ ok: true, message }));
