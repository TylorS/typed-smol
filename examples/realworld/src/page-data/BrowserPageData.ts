import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import type { RealWorldClient } from "../Api.js";
import { PageData } from "./PageData.js";

const pageSize = 10;

export const BrowserPageData = <R>(clientEffect: Effect.Effect<RealWorldClient, never, R>) =>
  Layer.effect(
    PageData,
    Effect.gen(function* () {
      const client = yield* clientEffect;
      return {
        home: Effect.fn(function* ({ page }) {
          const { response, tagList } = yield* Effect.all({
            response: client.articles.list({
              params: {},
              query: pageFilter(page),
              headers: {},
            }),
            tagList: client.tags.list({ params: {}, query: {} }),
          }, { concurrency: "unbounded" });
          return { ...response, tags: tagList.tags, page };
        }),
        tag: Effect.fn(function* ({ page, tag }) {
          const { response, tagList } = yield* Effect.all({
            response: client.articles.list({
              params: {},
              query: { ...pageFilter(page), tag },
              headers: {},
            }),
            tagList: client.tags.list({ params: {}, query: {} }),
          }, { concurrency: "unbounded" });
          return { ...response, tags: tagList.tags, page, selectedTag: tag };
        }),
        article: Effect.fn(function* ({ slug }) {
          const { article, commentList } = yield* Effect.all({
            article: client.articles.get({ params: { slug }, query: {}, headers: {} }),
            commentList: client.comments.list({
              params: { slug },
              query: {},
              headers: {},
            }),
          }, { concurrency: "unbounded" });
          return { article: article.article, comments: commentList.comments };
        }),
        profile: Effect.fn(function* ({ favorites, username }) {
          const { profile, feed } = yield* Effect.all({
            profile: client.profiles.get({
              params: { username },
              query: {},
              headers: {},
            }),
            feed: client.articles.list({
              params: {},
              query: favorites
                ? { favorited: username, limit: pageSize }
                : { author: username, limit: pageSize },
              headers: {},
            }),
          }, { concurrency: "unbounded" });
          return { profile: profile.profile, ...feed, favorites };
        }),
      };
    }),
  );

const pageFilter = (page: number) => ({
  limit: pageSize,
  offset: (page - 1) * pageSize,
});
