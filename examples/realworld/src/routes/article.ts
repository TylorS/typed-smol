import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { ApiClient, article as articleRouteData } from "../common/routeData.js";
import { html } from "@typed/template";
import { ArticleContent } from "../common/components/ArticleContent.js";
import { AsyncDataView } from "../common/components/AsyncDataView.js";
import { ArticleRoute } from "../common/routes.js";
import type { Handler } from "./$route-types";

export const route = ArticleRoute;
export const template = ((params) => Fx.gen(function* () {
  const client = yield* ApiClient;
  const data = yield* RefAsyncData.fromComputedEffect(params, (input) =>
    articleRouteData(client, input));

  return html`${AsyncDataView(data, ArticleContent)}`;
})) satisfies Handler;
