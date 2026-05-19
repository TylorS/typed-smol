import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import { Articles, Comments, Profiles, Tags } from "../application/Services.js";
import { notFound } from "../application/Common.js";
import { PageData } from "./PageData.js";

const pageSize = 10;

export const ServerPageData = Layer.effect(
  PageData,
  Effect.gen(function* () {
    const articles = yield* Articles;
    const comments = yield* Comments;
    const profiles = yield* Profiles;
    const tags = yield* Tags;

    return {
      home: Effect.fn(function* ({ page }) {
        const response = yield* articles.list(pageFilter(page), Option.none());
        const tagList = yield* tags.list();
        return { ...response, tags: tagList.tags, page };
      }),
      tag: Effect.fn(function* ({ page, tag }: { readonly page: number; readonly tag: string }) {
        const response = yield* articles.list({ ...pageFilter(page), tag }, Option.none());
        const tagList = yield* tags.list();
        return { ...response, tags: tagList.tags, page, selectedTag: tag };
      }),
      article: Effect.fn(function* ({ slug }: { readonly slug: string }) {
        const article = yield* articles.get(Option.none(), slug);
        const commentList = yield* comments.list(slug, Option.none());
        if (!article.article.body) return yield* Effect.fail(notFound("article"));
        return { article: article.article, comments: commentList.comments };
      }),
      profile: Effect.fn(function* ({
        favorites,
        username,
      }: {
        readonly favorites: boolean;
        readonly username: string;
      }) {
        const profile = yield* profiles.get(username, Option.none());
        const feed = yield* articles.list(
          favorites ? { favorited: username, limit: pageSize } : { author: username, limit: pageSize },
          Option.none(),
        );
        return { profile: profile.profile, ...feed, favorites };
      }),
    };
  }),
);

const pageFilter = (page: number) => ({
  limit: pageSize,
  offset: (page - 1) * pageSize,
});
