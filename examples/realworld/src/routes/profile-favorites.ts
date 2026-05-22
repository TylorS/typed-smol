import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { ApiClient, profile as profileRouteData } from "../common/routeData.js";
import { html } from "@typed/template";
import { AsyncDataView } from "../common/components/AsyncDataView.js";
import { ProfileContent } from "../common/components/ProfileContent.js";
import { ProfileFavoritesRoute } from "../common/routes.js";
import type { Handler } from "./$route-types";

export const route = ProfileFavoritesRoute;
export const template = Fx.fn("ProfileFavorites")(function* (params) {
  const client = yield* ApiClient;
  const { username } = RefSubject.proxy(params);
  const data = yield* RefAsyncData.fromComputedEffect(username, (value) =>
    profileRouteData(client, { favorites: true, username: value }),
  );

  return html`${AsyncDataView(data, ProfileContent)}`;
}) satisfies Handler;
