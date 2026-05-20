import { Fx, RefAsyncData } from "@typed/fx";
import { PageData } from "../page-data/PageData.js";
import { ArticlePage } from "../presentation/ArticlePage.js";
import { ArticleRoute } from "../routing/Routes.js";
import type { Template } from "./$route-types";

export const route = ArticleRoute;
export const template = Fx.fn("ArticlePage")(function* (params) {
  const pageData = yield* PageData;
  const data = yield* RefAsyncData.fromComputedEffect(params, pageData.article);

  return ArticlePage(data);
}) satisfies Template;
