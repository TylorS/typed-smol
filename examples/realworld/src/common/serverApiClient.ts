import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { Articles, Comments, Profiles, Tags } from "../application/Services.js";
import { ApiClient, type RouteApiClient } from "./routeData.js";
import { articleFilter, authToken } from "./http.js";

export const ServerApiClient = Layer.effect(
  ApiClient,
  Effect.gen(function* () {
    const articles = yield* Articles;
    const comments = yield* Comments;
    const profiles = yield* Profiles;
    const tags = yield* Tags;

    return {
      articles: {
        get: Effect.fn(function* ({ headers, params }) {
          return yield* articles.get(authToken(headers), params.slug);
        }),
        list: Effect.fn(function* ({ headers, query }) {
          return yield* articles.list(articleFilter(query), authToken(headers));
        }),
      },
      comments: {
        list: Effect.fn(function* ({ headers, params }) {
          return yield* comments.list(params.slug, authToken(headers));
        }),
      },
      profiles: {
        get: Effect.fn(function* ({ headers, params }) {
          return yield* profiles.get(params.username, authToken(headers));
        }),
      },
      tags: {
        list: Effect.fn(function* () {
          return yield* tags.list();
        }),
      },
    } satisfies RouteApiClient;
  }),
);
