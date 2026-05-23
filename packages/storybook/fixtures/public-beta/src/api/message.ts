import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Route from "@typed/router";
import { ApiMessage } from "./_dependencies.js";

export const route = Route.Parse("/message");
export const method = "GET";
export const success = Schema.Struct({ message: Schema.String });
export const error = Schema.Struct({ message: Schema.String });

export const handler = () =>
  ApiMessage.pipe(Effect.map((service) => ({
    message: service.message,
  })));
