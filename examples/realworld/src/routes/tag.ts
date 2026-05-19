import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { Navigation } from "@typed/navigation";
import { RouteHandler } from "@typed/app/RouteHandler";
import { PageData } from "../page-data/PageData.js";
import { FeedPage } from "../presentation/Feed.js";
import { TagRoute } from "../routing/Routes.js";

export const route = TagRoute;
export const template = RouteHandler(route)(Fx.fn("TagPage")(function* (params) {
  const pageData = yield* PageData;
  const { tag } = RefSubject.proxy(params);
  const page = RefSubject.map(Navigation.currentEntry, (entry) => pageFromUrl(entry.url.href));
  const data = yield* RefAsyncData.fromComputedEffect(
    RefSubject.struct({ page, tag }),
    (input) => pageData.tag(input),
  );

  return FeedPage(data);
}));

const pageFromUrl = (url: string): number => {
  const value = new URL(url, "http://localhost").searchParams.get("page");
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};
