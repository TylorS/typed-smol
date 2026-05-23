import * as Schema from "effect/Schema";
import { describe, expect, it } from "vitest";
import {
  ErrorResponse,
  MultipleArticlesResponse,
  MultipleCommentsResponse,
  ProfileResponse,
  SingleArticleResponse,
  SingleCommentResponse,
  TagsResponse,
  UserResponse,
} from "../../domain/RealWorldApi.js";

const isoNow = "2026-05-16T18:00:00.000Z";

const user = {
  email: "reader@example.com",
  token: "opaque-session-token",
  username: "reader",
  bio: null,
  image: null,
};

const profile = {
  username: "author",
  bio: "Writes about Typed and Effect.",
  image: "/default-avatar.svg",
  following: true,
};

const article = {
  slug: "typed-realworld",
  title: "Typed RealWorld",
  description: "A full-stack Typed example.",
  body: "Real data all the way down.",
  tagList: ["typed", "effect", "realworld"],
  createdAt: isoNow,
  updatedAt: isoNow,
  favorited: true,
  favoritesCount: 7,
  author: profile,
};

const articlePreview = {
  slug: article.slug,
  title: article.title,
  description: article.description,
  tagList: article.tagList,
  createdAt: article.createdAt,
  updatedAt: article.updatedAt,
  favorited: article.favorited,
  favoritesCount: article.favoritesCount,
  author: article.author,
};

const comment = {
  id: 42,
  createdAt: isoNow,
  updatedAt: isoNow,
  body: "This is a real comment.",
  author: profile,
};

const roundTrip = <A, I>(schema: Schema.Codec<A, I, never, never>, input: I): I => {
  const decoded = Schema.decodeUnknownSync(schema)(input);
  return Schema.encodeSync(schema)(decoded);
};

describe("RealWorld API response schemas", () => {
  it("round-trips all response envelope shapes", () => {
    expect(roundTrip(UserResponse, { user })).toEqual({ user });
    expect(roundTrip(ProfileResponse, { profile })).toEqual({ profile });
    expect(roundTrip(SingleArticleResponse, { article })).toEqual({ article });
    expect(
      roundTrip(MultipleArticlesResponse, { articles: [articlePreview], articlesCount: 1 }),
    ).toEqual({ articles: [articlePreview], articlesCount: 1 });
    expect(roundTrip(SingleCommentResponse, { comment })).toEqual({ comment });
    expect(roundTrip(MultipleCommentsResponse, { comments: [comment] })).toEqual({
      comments: [comment],
    });
    expect(roundTrip(TagsResponse, { tags: ["typed", "effect", "sqlite"] })).toEqual({
      tags: ["typed", "effect", "sqlite"],
    });
    expect(roundTrip(ErrorResponse, { errors: { email: ["can't be blank"] } })).toEqual({
      errors: { email: ["can't be blank"] },
    });
  });

  it("keeps article previews body-free", () => {
    const payload = {
      articles: [{ ...articlePreview, body: "should be omitted" }],
      articlesCount: 1,
    };
    const encoded = roundTrip(MultipleArticlesResponse, payload);

    expect("body" in encoded.articles[0]).toBe(false);
  });

  it("rejects malformed response payloads", () => {
    expect(() =>
      Schema.decodeUnknownSync(UserResponse)({ user: { ...user, token: null } }),
    ).toThrow();
    expect(() =>
      Schema.decodeUnknownSync(MultipleArticlesResponse)({
        articles: [articlePreview],
        articlesCount: -1,
      }),
    ).toThrow();
    expect(() =>
      Schema.decodeUnknownSync(ErrorResponse)({
        errors: { email: "can't be blank" },
      }),
    ).toThrow();
  });
});
