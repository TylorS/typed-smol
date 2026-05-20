import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { Articles } from "../../application/Articles.js";
import { NonNegativeInt } from "../../domain/Ids.js";
import { MultipleArticlesResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken, feedFilter } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Join(
  Route.Parse("/articles/feed"),
  Route.QueryParams(
    Route.OptionalParamWithSchema("limit", Schema.NumberFromString.pipe(Schema.decodeTo(NonNegativeInt))),
    Route.OptionalParamWithSchema("offset", Schema.NumberFromString.pipe(Schema.decodeTo(NonNegativeInt))),
  ),
);
export const method = HttpMethod.Get;
export const success = MultipleArticlesResponse;

export const handler = Effect.fn("Articles.feed")(function* ({ headers, query }) {
  return yield* respond(Articles.use((articles) => articles.feed(authToken(headers), feedFilter(query))));
}) satisfies RawHandler<Articles>;
