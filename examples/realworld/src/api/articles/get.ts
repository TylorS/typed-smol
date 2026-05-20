import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Articles } from "../../application/Articles.js";
import { SingleArticleResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../api-support/Common.js";
import { respond } from "../../api-support/HttpErrors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/articles/:slug");
export const method = HttpMethod.Get;
export const success = SingleArticleResponse;

export const handler = Effect.fn("Articles.get")(function* ({ headers, path }) {
  return yield* respond(Articles.use((articles) => articles.get(authToken(headers), path.slug)));
}) satisfies RawHandler<Articles>;
