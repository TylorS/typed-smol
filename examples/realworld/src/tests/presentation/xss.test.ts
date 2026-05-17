import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { renderToHtmlString, StaticHtmlRenderTemplate } from "@typed/template";
import { ArticlePage } from "../../presentation/ArticlePage.js";
import { FeedPage } from "../../presentation/Feed.js";
import { ProfilePage } from "../../presentation/ProfilePage.js";
import { avatarSrc, defaultAvatar } from "../../presentation/Layout.js";

const profile = {
  username: "reader",
  bio: "<img src=x onerror=alert(1)> javascript:alert(1)",
  image: "javascript:alert(1)",
  following: false,
};

const article = {
  slug: "typed-runtime",
  title: "Typed Runtime",
  description: "<img src=x onerror=alert(1)> javascript:alert(1)",
  body: "## Body\n\n<img src=x onerror=alert(1)> [x](javascript:alert(1))",
  tagList: ["typed"],
  createdAt: "2026-05-17T00:00:00.000Z",
  updatedAt: "2026-05-17T00:00:00.000Z",
  favorited: false,
  favoritesCount: 0,
  author: profile,
};

describe("realworld presentation XSS hardening", () => {
  it("falls back to the default avatar for unsafe image URLs", () => {
    expect(avatarSrc(null)).toBe(defaultAvatar);
    expect(avatarSrc("")).toBe(defaultAvatar);
    expect(avatarSrc("javascript:alert(1)")).toBe(defaultAvatar);
    expect(avatarSrc("data:text/html,<script>alert(1)</script>")).toBe(defaultAvatar);
    expect(avatarSrc("https://cdn.example.test/avatar.png")).toBe(
      "https://cdn.example.test/avatar.png",
    );
  });

  it("escapes article body Markdown, comments, avatars, and author text contexts", async () => {
    const html = await render(ArticlePage(article, [{
      id: 1,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      body: "<script>alert(1)</script> javascript:alert(1)",
      author: profile,
    }]));

    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("onerror=");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('src="/default-avatar.svg"');
  });

  it("escapes feed descriptions and profile bio contexts", async () => {
    const feed = await render(FeedPage({
      articles: [article],
      articlesCount: 1,
      page: 1,
      tags: ["typed"],
    }));
    const page = await render(ProfilePage({
      articles: [article],
      articlesCount: 1,
      favorites: false,
      profile,
    }));

    expect(feed).not.toContain("<img src=x");
    expect(feed).not.toContain("javascript:");
    expect(page).not.toContain("<img src=x");
    expect(page).not.toContain("javascript:");
  });
});

const render = (template: Parameters<typeof renderToHtmlString>[0]): Promise<string> =>
  Effect.runPromise(
    renderToHtmlString(template).pipe(
      Effect.provide(StaticHtmlRenderTemplate),
      Effect.scoped,
    ),
  );
