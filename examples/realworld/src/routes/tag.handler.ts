import { RouteHandler } from "@typed/app";
import { Fx } from "@typed/fx";
import { Navigation } from "@typed/navigation";
import { Effect, Option } from "effect";
import { Articles, Tags } from "../application/Services.js";
import { HomePage } from "../presentation/App.js";
import { route } from "./tag.js";

export const handler = RouteHandler(route)((paramsRef) =>
  Fx.unwrap(Effect.gen(function* () {
    const params = yield* paramsRef;
    const articles = yield* Articles;
    const tags = yield* Tags;
    const entry = yield* Navigation.currentEntry;
    const page = pageFromUrl(entry.url.href);
    const response = yield* articles.list(
      { tag: params.tag, limit: 10, offset: (page - 1) * 10 },
      Option.none(),
    );
    const tagList = yield* tags.list();
    return HomePage({ ...response, tags: tagList.tags, page, selectedTag: params.tag });
  })));

const pageFromUrl = (url: string): number => {
  const value = new URL(url, "http://localhost").searchParams.get("page");
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
};
