import { RouteHandler } from "@typed/app";
import { Fx } from "@typed/fx";
import { Effect, Option } from "effect";
import { Articles, Profiles } from "../application/Services.js";
import { ProfileDetailPage } from "../presentation/App.js";
import { ProfileFavoritesRoute } from "../routing/Routes.js";

export const route = ProfileFavoritesRoute;

export const handler = RouteHandler(route)((paramsRef) =>
  Fx.unwrap(Effect.gen(function* () {
    const params = yield* paramsRef;
    const profiles = yield* Profiles;
    const articles = yield* Articles;
    const profile = yield* profiles.get(params.username, Option.none());
    const feed = yield* articles.list({ favorited: params.username, limit: 10 }, Option.none());
    return ProfileDetailPage({ profile: profile.profile, ...feed, favorites: true });
  })));
