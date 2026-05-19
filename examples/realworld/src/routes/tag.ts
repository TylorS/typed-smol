import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { RouteHandler } from "@typed/app/RouteHandler";
import { PageData } from "../page-data/PageData.js";
import { FeedPage } from "../presentation/Feed.js";
import { TagRoute } from "../routing/Routes.js";

export const route = TagRoute;
export const template = RouteHandler(route)(Fx.fn("TagPage")(function* (params) {
  const pageData = yield* PageData;
  const input = RefSubject.map(params, ({ page, tag }) => ({ page: page ?? 1, tag }));
  const data = yield* RefAsyncData.fromComputedEffect(
    input,
    (input) => pageData.tag(input),
  );

  return FeedPage(data);
}));
