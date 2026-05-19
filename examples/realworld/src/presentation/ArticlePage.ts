import * as AsyncData from "@typed/async-data";
import { RefAsyncData, RefSubject } from "@typed/fx";
import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { html, many, unsafeHtml } from "@typed/template";
import { Link } from "@typed/ui";
import * as Effect from "effect/Effect";
import type { Article, Comment } from "../domain/Article.js";
import type { ArticlePageData } from "../page-data/PageData.js";
import { renderMarkdown, safeTextPreview } from "../domain/Markdown.js";
import { BrowserAuth } from "./BrowserAuth.js";
import { FormTargetError, clickIntent, formSubmit, textField } from "./FormEvents.js";
import { avatarSrc } from "./Layout.js";
import { AsyncDataMessages, AsyncDataSuccess } from "./AsyncDataView.js";

export const ArticlePage = <E, R>(
  input: RefAsyncData.RefAsyncData<ArticlePageData, E, never, R>,
) => html`${AsyncDataMessages(input)} ${AsyncDataSuccess(input, ArticlePageContent)}`;

const ArticlePageContent = <E, R>(
  input: RefSubject.Computed<ArticlePageData, E, R>,
) => {
  const { article, comments } = RefSubject.proxy(input);
  const articleFields = RefSubject.proxy(article);
  const author = RefSubject.proxy(articleFields.author);
  const title = RefSubject.map(articleFields.title, safeTextPreview);
  const body = RefSubject.map(articleFields.body, (source) => unsafeHtml(renderMarkdown(source)));
  const authorName = RefSubject.map(author.username, safeTextPreview);

  return html`<section class="article-page">
    <div class="banner">
      <div class="container">
        <h1>${title}</h1>
        <div class="article-meta">${ArticleMeta(article)}</div>
      </div>
    </div>
    <div class="container page">
      <div class="article-content">${body}</div>
      <ul class="tag-list">
        ${many(articleFields.tagList, (tag) => tag, Tag)}
      </ul>
      <hr />
      <div class="article-actions">
        <button class="btn btn-outline-primary btn-sm" onclick=${favoriteArticle(article)}>
          Favorite Article (${articleFields.favoritesCount})
        </button>
        <button class="btn btn-outline-primary btn-sm" onclick=${followAuthor(article)}>
          Follow ${authorName}
        </button>
      </div>
      ${CommentForm(articleFields.slug)}
      ${many(
        comments,
        (comment) => comment.id,
        (comment) => CommentCard(articleFields.slug, comment),
      )}
    </div>
  </section>`;
};

export type ArticleAsyncData<E = never> = AsyncData.AsyncData<ArticlePageData, E>;

const ArticleMeta = <E, R>(articleRef: RefSubject.Computed<Article, E, R>) => {
  const article = RefSubject.proxy(articleRef);
  const author = RefSubject.proxy(article.author);
  const profileHref = RefSubject.map(author.username, (value) => `/profile/${value}`);
  const avatar = RefSubject.map(author.image, avatarSrc);
  const displayName = RefSubject.map(author.username, safeTextPreview);

  return html`${Link({ href: profileHref, content: html`<img src=${avatar} />` })}
    <div class="info">
      ${Link({ class: "author", href: profileHref, content: displayName })}
      <span class="date">${article.createdAt}</span>
    </div>
  `;
};

const CommentForm = <E, R>(slug: RefSubject.Computed<string, E, R>) => html`<form
  class="card comment-form"
  onsubmit=${postComment(slug)}
>
  <div class="card-block">
    <textarea class="form-control" name="body" placeholder="Write a comment..." rows="3"></textarea>
  </div>
  <div class="card-footer">
    <button class="btn btn-sm btn-primary">Post Comment</button>
  </div>
</form>`;

const CommentCard = <E, R>(
  slug: RefSubject.Computed<string, E, R>,
  commentRef: RefSubjectType<Comment>,
) => {
  const comment = RefSubject.proxy(commentRef);
  const author = RefSubject.proxy(comment.author);
  const body = RefSubject.map(comment.body, safeTextPreview);
  const profileHref = RefSubject.map(author.username, (value) => `/profile/${value}`);
  const avatar = RefSubject.map(author.image, avatarSrc);
  const displayName = RefSubject.map(author.username, safeTextPreview);
  return html`<div class="card">
    <div class="card-block">
      <p class="card-text">${body}</p>
    </div>
    <div class="card-footer">
      ${Link({
        class: "comment-author",
        href: profileHref,
        content: html`<img class="comment-author-img" src=${avatar} />
          ${displayName}`,
      })}
      <span class="mod-options">
        <button class="btn btn-sm btn-outline-danger" onclick=${deleteComment(slug, comment.id)}>
          <i class="ion-trash-a"></i>
        </button>
      </span>
    </div>
  </div>`;
};

const Tag = <A extends string>(tag: RefSubjectType<A>) =>
  html`<li class="tag-default tag-pill tag-outline">${tag}</li>`;

const favoriteArticle = <E, R>(article: RefSubject.Computed<Article, E, R>) =>
  clickIntent(
    Effect.fn(function* () {
      const current = yield* readActionValue(article);
      const auth = yield* BrowserAuth;
      return yield* auth.favoriteArticle(current.slug, current.favorited);
    }),
  );

const followAuthor = <E, R>(article: RefSubject.Computed<Article, E, R>) =>
  clickIntent(
    Effect.fn(function* () {
      const current = yield* readActionValue(article);
      const auth = yield* BrowserAuth;
      return yield* auth.followProfile(current.author.username, current.author.following);
    }),
  );

const postComment = <E, R>(slug: RefSubject.Computed<string, E, R>) =>
  formSubmit(
    Effect.fn(function* (form: HTMLFormElement) {
      const currentSlug = yield* readActionValue(slug);
      const auth = yield* BrowserAuth;
      return yield* auth.createComment(currentSlug, { comment: { body: textField(form, "body") } });
    }),
  );

const deleteComment = <A extends number, E, R>(
  slug: RefSubject.Computed<string, E, R>,
  id: RefSubject.Computed<A>,
) =>
  clickIntent(
    Effect.fn(function* () {
      const currentSlug = yield* readActionValue(slug);
      const commentId = yield* id;
      const auth = yield* BrowserAuth;
      return yield* auth.deleteComment(currentSlug, commentId);
    }),
  );

const readActionValue = <A, E, R>(
  value: RefSubject.Computed<A, E, R>,
): Effect.Effect<A, FormTargetError, R> =>
  value.pipe(
    Effect.mapError(() => new FormTargetError({ reason: "reactive value is unavailable" })),
  );
