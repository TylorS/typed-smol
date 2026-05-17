import { html } from "@typed/template";
import type { Article, Comment } from "../domain/Article.js";
import { renderMarkdown, safeTextPreview } from "../domain/Markdown.js";
import { BrowserAuth } from "./BrowserAuth.js";
import { clickIntent, formSubmit, textField } from "./FormEvents.js";
import { avatarSrc } from "./Layout.js";

export const ArticlePage = (
  article: Article,
  comments: readonly Comment[],
) => html`<section class="article-page">
  <div class="banner">
    <div class="container">
      <h1>${safeTextPreview(article.title)}</h1>
      <div class="article-meta">${ArticleMeta(article)}</div>
    </div>
  </div>
  <div class="container page">
    <div class="article-content">${renderMarkdown(article.body)}</div>
    <ul class="tag-list">
      ${article.tagList.map(Tag)}
    </ul>
    <hr />
    <div class="article-actions">
      <button class="btn btn-outline-primary btn-sm" onclick=${favoriteArticle(article)}>
        Favorite Article (${article.favoritesCount})
      </button>
      <button class="btn btn-outline-primary btn-sm" onclick=${followAuthor(article)}>
        Follow ${safeTextPreview(article.author.username)}
      </button>
    </div>
    ${CommentForm(article.slug)} ${comments.map((comment) => CommentCard(article.slug, comment))}
  </div>
</section>`;

const ArticleMeta = (article: Article) => html`<a href=${`/profile/${article.author.username}`}>
  <img src=${avatarSrc(article.author.image)} />
</a>
<div class="info">
  <a class="author" href=${`/profile/${article.author.username}`}>
    ${safeTextPreview(article.author.username)}
  </a>
  <span class="date">${article.createdAt}</span>
</div>`;

const CommentForm = (slug: string) => html`<form class="card comment-form" onsubmit=${postComment(slug)}>
  <div class="card-block">
    <textarea
      class="form-control"
      name="body"
      placeholder="Write a comment..."
      rows="3"
    ></textarea>
  </div>
  <div class="card-footer">
    <button class="btn btn-sm btn-primary">Post Comment</button>
  </div>
</form>`;

const CommentCard = (slug: string, comment: Comment) => html`<div class="card">
  <div class="card-block"><p class="card-text">${safeTextPreview(comment.body)}</p></div>
  <div class="card-footer">
    <a class="comment-author" href=${`/profile/${comment.author.username}`}>
      <img class="comment-author-img" src=${avatarSrc(comment.author.image)} />
      ${safeTextPreview(comment.author.username)}
    </a>
    <span class="mod-options">
      <button class="btn btn-sm btn-outline-danger" onclick=${deleteComment(slug, comment.id)}>
        <i class="ion-trash-a"></i>
      </button>
    </span>
  </div>
</div>`;

const Tag = (tag: string) =>
  html`<li class="tag-default tag-pill tag-outline">${tag}</li>`;

const favoriteArticle = (article: Article) =>
  clickIntent(() =>
    BrowserAuth.use((auth) => auth.favoriteArticle(article.slug, article.favorited)));

const followAuthor = (article: Article) =>
  clickIntent(() =>
    BrowserAuth.use((auth) =>
      auth.followProfile(article.author.username, article.author.following)));

const postComment = (slug: string) =>
  formSubmit((form) =>
    BrowserAuth.use((auth) =>
      auth.createComment(slug, { comment: { body: textField(form, "body") } })));

const deleteComment = (slug: string, id: number) =>
  clickIntent(() => BrowserAuth.use((auth) => auth.deleteComment(slug, id)));
