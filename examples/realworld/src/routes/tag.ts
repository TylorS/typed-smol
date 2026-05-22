import { Fx, RefAsyncData, RefSubject } from "@typed/fx";
import { PageData } from "../page-data/PageData.js";
import { FeedPage } from "../presentation/Feed.js";
import { TagRoute } from "../routing/Routes.js";
import type { Handler, Params } from "./$route-types";

export const route = TagRoute;
export const template = Fx.fn("TagPage")(function* (params: RefSubject.RefSubject<Params>) {
  const pageData = yield* PageData;
  const input = RefSubject.map(params, ({ page, tag }) => ({ page: page ?? 1, tag }));
  const data = yield* RefAsyncData.fromComputedEffect(
    input,
    (input) => pageData.tag(input),
  );

  return FeedPage(data);
}) satisfies Handler;
