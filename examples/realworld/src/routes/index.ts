import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { PageData } from "../page-data/PageData.js";
import { FeedPage } from "../presentation/Feed.js";
import { HomeRoute } from "../routing/Routes.js";
import type { Template } from "./$route-types";

export const route = HomeRoute;
export const template = Fx.fn("HomePage")(function* (params) {
  const pageData = yield* PageData;
  const page = RefSubject.map(params, ({ page }) => page ?? 1);
  const data = yield* RefAsyncData.fromComputedEffect(page, (currentPage) =>
    pageData.home({ page: currentPage }));

  return FeedPage(data);
}) satisfies Template;
