import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Articles } from "../../application/Articles.js";
import { MultipleArticlesResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, articleFilter, authToken } from "../../common/http.js";
import { respond } from "../../common/errors.js";
import { PaginationQuery } from "../../common/routeParams.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Join(
  Route.Slash,
  Route.QueryParams(
    Route.Param("author").optional(),
    Route.Param("favorited").optional(),
    Route.Param("tag").optional(),
  ),
  PaginationQuery,
);
export const method = HttpMethod.Get;
export const success = MultipleArticlesResponse;

export const handler = Effect.fn("Articles.list")(function* ({ headers, query }) {
  return yield* respond(
    Articles.use((articles) => articles.list(articleFilter(query), authToken(headers))),
  );
}) satisfies RawHandler<Articles>;
