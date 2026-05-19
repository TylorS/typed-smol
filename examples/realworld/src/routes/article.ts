import { Fx, RefAsyncData } from "@typed/fx";
import { PageData } from "../page-data/PageData.js";
import { ArticlePage } from "../presentation/ArticlePage.js";
import { ArticleRoute } from "../routing/Routes.js";
import { RouteHandler } from "@typed/app/RouteHandler";

export const route = ArticleRoute;
export const template = RouteHandler(route)(Fx.fn('ArticlePage')(function* (params) {
  const pageData = yield* PageData;
  const data = yield* RefAsyncData.fromComputedEffect(params, pageData.article);

  return ArticlePage(data);
}));
