import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { ApiClient, profile as profileRouteData } from "../common/routeData.js";
import { html } from "@typed/template";
import { AsyncDataView } from "../common/components/AsyncDataView.js";
import { ProfileContent } from "../common/components/ProfileContent.js";
import { ProfileRoute } from "../common/routes.js";
import type { Handler } from "./$route-types";

export const route = ProfileRoute;
export const template = ((params) => Fx.gen(function* () {
  const client = yield* ApiClient;
  const { username } = RefSubject.proxy(params);
  const data = yield* RefAsyncData.fromComputedEffect(username, (value) =>
    profileRouteData(client, { favorites: false, username: value }));

  return html`${AsyncDataView(data, ProfileContent)}`;
})) satisfies Handler;
