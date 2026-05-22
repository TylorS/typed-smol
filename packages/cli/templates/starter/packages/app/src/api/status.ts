import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import { message } from "@__APP_NAME__/shared";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("status");
export const method = "GET";
export const success = Schema.Struct({
  ok: Schema.Literal(true),
  message: Schema.String,
});

export const handler = Effect.fn("Status.get")(function* () {
  return yield* HttpServerResponse.json({ ok: true, message });
}) satisfies RawHandler;
