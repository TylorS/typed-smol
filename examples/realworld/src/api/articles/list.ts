import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { Articles } from "../../application/Articles.js";
import { NonNegativeInt } from "../../domain/Ids.js";
import { MultipleArticlesResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, articleFilter, authToken } from "../../common/http.js";
import { respond } from "../../common/errors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Join(
  Route.Slash,
  Route.QueryParams(
    Route.Param("author").optional(),
    Route.Param("favorited").optional(),
    Route.ParamWithSchema(
      "limit",
      Schema.NumberFromString.pipe(Schema.decodeTo(NonNegativeInt)),
    ).optional(),
    Route.ParamWithSchema(
      "offset",
      Schema.NumberFromString.pipe(Schema.decodeTo(NonNegativeInt)),
    ).optional(),
    Route.Param("tag").optional(),
  ),
);
export const method = HttpMethod.Get;
export const success = MultipleArticlesResponse;

export const handler = Effect.fn("Articles.list")(function* ({ headers, query }) {
  return yield* respond(
    Articles.use((articles) => articles.list(articleFilter(query), authToken(headers))),
  );
}) satisfies RawHandler<Articles>;
