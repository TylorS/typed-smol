import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { ApiClient, tag as tagRouteData } from "../common/routeData.js";
import { html } from "@typed/template";
import { AsyncDataView } from "../common/components/AsyncDataView.js";
import { Banner } from "../common/components/Banner.js";
import { FeedContent } from "../common/components/FeedContent.js";
import { TagRoute } from "../common/routes.js";
import type { Handler } from "./$route-types";

export const route = TagRoute;
export const template = Fx.fn("Tag")(function* (params) {
  const client = yield* ApiClient;
  const input = RefSubject.map(params, ({ page, tag }) => ({ page: page ?? 1, tag }));
  const data = yield* RefAsyncData.fromComputedEffect(input, (input) =>
    tagRouteData(client, input),
  );

  return html`<section class="home-page">
    ${Banner}
    <div class="container page">${AsyncDataView(data, FeedContent)}</div>
  </section>`;
}) satisfies Handler;
