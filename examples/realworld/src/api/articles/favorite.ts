import * as Route from "@typed/router";
import * as Effect from "effect/Effect";
import { Articles } from "../../application/Articles.js";
import { SingleArticleResponse } from "../../domain/RealWorldApi.js";
import { HttpMethod, authToken } from "../../common/http.js";
import { respond } from "../../common/errors.js";
import type { RawHandler } from "./$api-types";

export const route = Route.Parse("/:slug/favorite");
export const method = HttpMethod.Post;
export const success = SingleArticleResponse;

export const handler = Effect.fn("Articles.favorite")(function* ({ headers, path }) {
  return yield* respond(Articles.use((articles) => articles.favorite(authToken(headers), path.slug)));
}) satisfies RawHandler<Articles>;
