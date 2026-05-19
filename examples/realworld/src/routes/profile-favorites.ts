import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { RouteHandler } from "@typed/app/RouteHandler";
import { PageData } from "../page-data/PageData.js";
import { ProfilePage } from "../presentation/ProfilePage.js";
import { ProfileFavoritesRoute } from "../routing/Routes.js";

export const route = ProfileFavoritesRoute;
export const template = RouteHandler(route)(Fx.fn("ProfileFavoritesPage")(function* (params) {
  const pageData = yield* PageData;
  const { username } = RefSubject.proxy(params);
  const data = yield* RefAsyncData.fromComputedEffect(username, (value) =>
    pageData.profile({ favorites: true, username: value }));

  return ProfilePage(data);
}));
