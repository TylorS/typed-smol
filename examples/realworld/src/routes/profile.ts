import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { RouteHandler } from "@typed/app/RouteHandler";
import { PageData } from "../page-data/PageData.js";
import { ProfilePage } from "../presentation/ProfilePage.js";
import { ProfileRoute } from "../routing/Routes.js";

export const route = ProfileRoute;
export const template = RouteHandler(route)(Fx.fn("ProfilePage")(function* (params) {
  const pageData = yield* PageData;
  const { username } = RefSubject.proxy(params);
  const data = yield* RefAsyncData.fromComputedEffect(username, (value) =>
    pageData.profile({ favorites: false, username: value }));

  return ProfilePage(data);
}));
