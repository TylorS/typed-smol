import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { defineApiHandler } from "@typed/app";
import { message } from "@__APP_NAME__/shared";

export const route = Route.Parse("status");
export const method = "GET";
export const handler = defineApiHandler(route, method)(() => Effect.succeed({ ok: true, message }));
