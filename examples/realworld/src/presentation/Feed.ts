import * as AsyncData from "@typed/async-data";
import { RefAsyncData, RefSubject } from "@typed/fx";
import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { html, many } from "@typed/template";
import * as Effect from "effect/Effect";
import type { ArticlePreview } from "../domain/Article.js";
import { safeTextPreview } from "../domain/Markdown.js";
import { BrowserAuth } from "./BrowserAuth.js";
import { clickIntent } from "./FormEvents.js";
import { avatarSrc, Banner } from "./Layout.js";
import { AsyncDataMessages, AsyncDataSuccess } from "./AsyncDataView.js";

export interface FeedPageInput {
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly tags: readonly string[];
  readonly page: number;
  readonly selectedTag?: string;
}

const pageSize = 10;

interface PageLinkData {
  readonly active: boolean;
  readonly href: string;
  readonly page: number;
}

export const FeedPage = <E, R>(
  input: RefAsyncData.RefAsyncData<FeedPageInput, E, never, R>,
) => html`<section class="home-page">
  ${Banner}
  <div class="container page">
    ${AsyncDataMessages(input)}
    ${AsyncDataSuccess(input, FeedPageContent)}
  </div>
</section>`;

const FeedPageContent = <E, R>(
  input: RefSubject.Computed<FeedPageInput, E, R>,
) => {
  const data = RefSubject.proxy(input);
  const selectedTag = data.selectedTag ?? RefSubject.map(data.page, () => undefined);

  return html`<div class="row">
    <div class="col-md-9">
      ${FeedToggle(input)}
      ${ArticleList({
        articles: data.articles,
        articlesCount: data.articlesCount,
        page: data.page,
        selectedTag,
      })}
    </div>
    <div class="col-md-3">${TagSidebar(data.tags)}</div>
  </div>`;
};

export type FeedAsyncData<E = never> = AsyncData.AsyncData<FeedPageInput, E>;

export const ArticleList = <E, R>(input: {
  readonly articles: RefSubject.Computed<readonly ArticlePreview[], E, R>;
  readonly articlesCount: RefSubject.Computed<number, E, R>;
  readonly page: RefSubject.Computed<number, E, R>;
  readonly selectedTag: RefSubject.Computed<string | undefined, E, R>;
}) => {
  const emptyMessages = RefSubject.map(
    input.articles,
    (articles) => articles.length === 0 ? ["No articles are here... yet."] : [],
  );

  return html`${many(emptyMessages, (message) => message, EmptyFeedMessage)}
    ${many(input.articles, (article) => article.slug, ArticlePreviewCard)}
    ${Pagination(input)}`;
};

export const ArticlePreviewCard = (
  articleRef: RefSubjectType<ArticlePreview>,
) => {
  const article = RefSubject.proxy(articleRef);
  const href = RefSubject.map(article.slug, (slug) => `/article/${slug}`);
  const title = RefSubject.map(article.title, safeTextPreview);
  const description = RefSubject.map(article.description, safeTextPreview);
  return html`<article class="article-preview">
  <div class="article-meta">${AuthorMeta(articleRef)}</div>
  <a class="preview-link" href=${href}>
    <h1>${title}</h1>
    <p>${description}</p>
    <span>Read more...</span>
    <ul class="tag-list">
      ${many(article.tagList, (tag) => tag, Tag)}
    </ul>
  </a>
</article>`;
};

const FeedToggle = <E, R>(inputRef: RefSubject.Computed<FeedPageInput, E, R>) => {
  const input = RefSubject.proxy(inputRef);
  const selectedTag = input.selectedTag ?? RefSubject.map(input.page, () => undefined);
  const globalFeedClass = RefSubject.map(selectedTag, (tag) => `nav-link${tag ? "" : " active"}`);
  const selectedTags = RefSubject.map(selectedTag, (tag) => tag ? [tag] : []);

  return html`<div class="feed-toggle">
  <ul class="nav nav-pills outline-active">
    <li class="nav-item"><a class="nav-link disabled">Your Feed</a></li>
    <li class="nav-item">
      <a
        class=${globalFeedClass}
        href="/"
      >Global Feed</a>
    </li>
    ${many(selectedTags, (tag) => tag, SelectedTagTab)}
  </ul>
</div>`;
};

const AuthorMeta = (articleRef: RefSubjectType<ArticlePreview>) => {
  const { author, favoritesCount } = RefSubject.proxy(articleRef);
  const { username, image } = RefSubject.proxy(author);
  const profileHref = RefSubject.map(username, (value) => `/profile/${value}`);
  const avatar = RefSubject.map(image, avatarSrc);
  const displayName = RefSubject.map(username, safeTextPreview);
  return html`<a href=${profileHref}>
  <img src=${avatar} />
</a>
<div class="info">
  <a class="author" href=${profileHref}>
    ${displayName}
  </a>
  <span class="date">${RefSubject.proxy(articleRef).createdAt}</span>
</div>
<button class="btn btn-outline-primary btn-sm" onclick=${favoriteArticle(articleRef)}>
  Favorite ${favoritesCount}
</button>`;
};

const Pagination = <E, R>(input: {
  readonly articlesCount: RefSubject.Computed<number, E, R>;
  readonly page: RefSubject.Computed<number, E, R>;
  readonly selectedTag: RefSubject.Computed<string | undefined, E, R>;
}) =>
  html`<ul class="pagination">
    ${many(RefSubject.map(RefSubject.struct(input), pageLinks), (link) => link.page, PageLink)}
  </ul>`;

const pageLinks = (
  input: {
    readonly articlesCount: number;
    readonly page: number;
    readonly selectedTag?: string;
  },
): readonly PageLinkData[] => {
  const pages = Math.ceil(input.articlesCount / pageSize);
  if (pages <= 1) return [];

  return Array.from({ length: pages }, (_, index) => {
    const page = index + 1;
    return {
      active: page === input.page,
      href: input.selectedTag ? `/tag/${input.selectedTag}?page=${page}` : `/?page=${page}`,
      page,
    };
  });
};

const PageLink = (linkRef: RefSubjectType<PageLinkData>) => {
  const link = RefSubject.proxy(linkRef);
  const itemClass = RefSubject.map(link.active, (active) => `page-item${active ? " active" : ""}`);
  const ariaCurrent = RefSubject.map(link.active, (active) => active ? "page" : null);
  return html`<li class=${itemClass}>
    <a class="page-link" href=${link.href} aria-current=${ariaCurrent}>
      ${link.page}
    </a>
  </li>`;
};

const EmptyFeedMessage = <A extends string>(message: RefSubjectType<A>) =>
  html`<p class="empty-feed-message">${message}</p>`;

const SelectedTagTab = <A extends string>(tag: RefSubject.RefSubject<A>) => {
  const href = RefSubject.map<A, never, never, string>(tag, tagHref);
  return html`<li class="nav-item">
    <a class="nav-link active" href=${href}>
      # ${tag}
    </a>
  </li>`;
};

const TagSidebar = <E, R>(tags: RefSubject.Computed<readonly string[], E, R>) => html`<div class="sidebar">
  <p>Popular Tags</p>
  <div class="tag-list">
    ${many(tags, (tag) => tag, TagSidebarLink)}
  </div>
</div>`;

const TagSidebarLink = <A extends string>(tag: RefSubject.RefSubject<A>) => {
  const href = RefSubject.map<A, never, never, string>(tag, tagHref);
  return html`<a class="tag-pill tag-default" href=${href}>
    ${tag}
  </a>`;
};

const Tag = <A extends string>(tag: RefSubjectType<A>) =>
  html`<li class="tag-default tag-pill tag-outline">${tag}</li>`;

const tagHref = (value: string): string => `/tag/${value}`;

const favoriteArticle = (article: RefSubjectType<ArticlePreview>) =>
  clickIntent(
    Effect.fn(function* () {
      const { favorited, slug } = yield* article;
      const auth = yield* BrowserAuth;
      return yield* auth.favoriteArticle(slug, favorited);
    }),
  );
