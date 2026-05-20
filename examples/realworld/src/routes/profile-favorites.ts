import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { PageData } from "../page-data/PageData.js";
import { ProfilePage } from "../presentation/ProfilePage.js";
import { ProfileFavoritesRoute } from "../routing/Routes.js";
import type { Template } from "./$route-types";

export const route = ProfileFavoritesRoute;
export const template = Fx.fn("ProfileFavoritesPage")(function* (params) {
  const pageData = yield* PageData;
  const { username } = RefSubject.proxy(params);
  const data = yield* RefAsyncData.fromComputedEffect(username, (value) =>
    pageData.profile({ favorites: true, username: value }));

  return ProfilePage(data);
}) satisfies Template;
