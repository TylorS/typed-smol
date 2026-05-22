import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { ApiClient, home } from "../common/routeData.js";
import { html } from "@typed/template";
import { AsyncDataView } from "../common/components/AsyncDataView.js";
import { Banner } from "../common/components/Banner.js";
import { FeedContent } from "../common/components/FeedContent.js";
import { HomeRoute } from "../common/routes.js";
import type { Handler } from "./$route-types";

export const route = HomeRoute;
export const template = ((params) => Fx.gen(function* () {
  const client = yield* ApiClient;
  const page = RefSubject.map(params, ({ page }) => page ?? 1);
  const data = yield* RefAsyncData.fromComputedEffect(page, (currentPage) =>
    home(client, { page: currentPage }));

  return html`<section class="home-page">
    ${Banner}
    <div class="container page">
      ${AsyncDataView(data, FeedContent)}
    </div>
  </section>`;
})) satisfies Handler;
