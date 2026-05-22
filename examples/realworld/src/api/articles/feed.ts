import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Articles } from "../../application/Articles.js";
import { MultipleArticlesResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken, feedFilter } from "../../common/http.js";
import { respond } from "../../common/errors.js";
import { PaginationQuery } from "../../common/routeParams.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Join(Route.Parse("/feed"), PaginationQuery);
export const method = HttpMethod.Get;
export const success = MultipleArticlesResponse;

export const handler = Effect.fn("Articles.feed")(function* ({ headers, query }) {
  return yield* respond(
    Articles.use((articles) => articles.feed(authToken(headers), feedFilter(query))),
  );
}) satisfies RawHandler<Articles>;
