import { html } from "@typed/template";
import type { ArticlePreview } from "../domain/Article.js";
import { avatarSrc, Banner } from "./Layout.js";

export interface FeedPageInput {
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly tags: readonly string[];
  readonly page: number;
  readonly selectedTag?: string;
}

const pageSize = 10;

export const FeedPage = (input: FeedPageInput) => html`<section class="home-page">
  ${Banner}
  <div class="container page">
    <div class="row">
      <div class="col-md-9">
        ${FeedToggle(input)} ${ArticleList(input)}
      </div>
      <div class="col-md-3">${TagSidebar(input.tags)}</div>
    </div>
  </div>
</section>`;

export const ArticleList = (input: {
  readonly articles: readonly ArticlePreview[];
  readonly articlesCount: number;
  readonly page: number;
  readonly selectedTag?: string;
}) =>
  input.articles.length === 0
    ? html`<p class="empty-feed-message">No articles are here... yet.</p>`
    : html`${input.articles.map(ArticlePreviewCard)} ${Pagination(input)}`;

export const ArticlePreviewCard = (article: ArticlePreview) => html`<article class="article-preview">
  <div class="article-meta">${AuthorMeta(article)}</div>
  <a class="preview-link" href=${`/article/${article.slug}`}>
    <h1>${article.title}</h1>
    <p>${article.description}</p>
    <span>Read more...</span>
    <ul class="tag-list">
      ${article.tagList.map(Tag)}
    </ul>
  </a>
</article>`;

const FeedToggle = (input: FeedPageInput) => html`<div class="feed-toggle">
  <ul class="nav nav-pills outline-active">
    <li class="nav-item"><a class="nav-link disabled">Your Feed</a></li>
    <li class="nav-item">
      <a class=${`nav-link${input.selectedTag ? "" : " active"}`} href="/">Global Feed</a>
    </li>
    ${input.selectedTag
      ? html`<li class="nav-item">
          <a class="nav-link active" href=${`/tag/${input.selectedTag}`}># ${input.selectedTag}</a>
        </li>`
      : null}
  </ul>
</div>`;

const AuthorMeta = (article: ArticlePreview) => html`<a href=${`/profile/${article.author.username}`}>
  <img src=${avatarSrc(article.author.image)} />
</a>
<div class="info">
  <a class="author" href=${`/profile/${article.author.username}`}>${article.author.username}</a>
  <span class="date">${article.createdAt}</span>
</div>
<button class="btn btn-outline-primary btn-sm">Favorite ${article.favoritesCount}</button>`;

const Pagination = (input: {
  readonly articlesCount: number;
  readonly page: number;
  readonly selectedTag?: string;
}) => {
  const pages = Math.ceil(input.articlesCount / pageSize);
  if (pages <= 1) return null;
  return html`<ul class="pagination">
    ${Array.from({ length: pages }, (_, i) => PageLink(input, i + 1))}
  </ul>`;
};

const PageLink = (
  input: { readonly page: number; readonly selectedTag?: string },
  page: number,
) => {
  const href = input.selectedTag ? `/tag/${input.selectedTag}?page=${page}` : `/?page=${page}`;
  return html`<li class=${`page-item${page === input.page ? " active" : ""}`}>
    <a class="page-link" href=${href} aria-current=${page === input.page ? "page" : null}>
      ${page}
    </a>
  </li>`;
};

const TagSidebar = (tags: readonly string[]) => html`<div class="sidebar">
  <p>Popular Tags</p>
  <div class="tag-list">
    ${tags.map((tag) => html`<a class="tag-pill tag-default" href=${`/tag/${tag}`}>${tag}</a>`)}
  </div>
</div>`;

const Tag = (tag: string) =>
  html`<li class="tag-default tag-pill tag-outline">${tag}</li>`;
