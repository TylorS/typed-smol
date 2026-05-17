import { RouteHandler } from "@typed/app";
import { Fx } from "@typed/fx";
import { Effect, Option } from "effect";
import { Articles, Comments } from "../application/Services.js";
import { notFound } from "../application/Common.js";
import { ArticleDetailPage } from "../presentation/App.js";
import { route } from "./article.js";

export const handler = RouteHandler(route)((paramsRef) =>
  Fx.unwrap(Effect.gen(function* () {
    const params = yield* paramsRef;
    const articles = yield* Articles;
    const comments = yield* Comments;
    const article = yield* articles.get(Option.none(), params.slug);
    const commentList = yield* comments.list(params.slug, Option.none());
    if (!article.article.body) return yield* Effect.fail(notFound("article"));
    return ArticleDetailPage(article.article, commentList.comments);
  })));
