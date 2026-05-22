import { Fx, RefSubject } from "@typed/fx";
import { EventHandler, html, many, unsafeHtml } from "@typed/template";
import * as Effect from "effect/Effect";
import type { Article } from "../../domain/Article.js";
import type { ArticleViewData } from "../routeData.js";
import { renderMarkdown, safeTextPreview } from "../../domain/Markdown.js";
import { BrowserAuth } from "../BrowserAuth.js";
import { FormTargetError, renderWorkflowFailure, targetForm } from "../workflowErrors.js";
import { ArticleMeta } from "./ArticleMeta.js";
import { ArticleTag } from "./ArticleTag.js";
import { CommentCard } from "./CommentCard.js";
import { CommentForm } from "./CommentForm.js";

export const ArticleContent = Fx.fn("ArticleContent")(<E, R>(
  input: RefSubject.Computed<ArticleViewData, E, R>,
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
        ${many(articleFields.tagList, (tag) => tag, ArticleTag)}
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
        (comment) => CommentCard({ slug: articleFields.slug, comment }),
      )}
    </div>
  </section>`;
});

const favoriteArticle = <E, R>(article: RefSubject.Computed<Article, E, R>) =>
  EventHandler.make(
    (event: MouseEvent) =>
      toggleFavorite(article).pipe(
        Effect.catch((error) => renderWorkflowFailure(targetForm(event), error)),
        Effect.asVoid,
      ),
    { preventDefault: true },
  );

const toggleFavorite = Effect.fn(function* <E, R>(article: RefSubject.Computed<Article, E, R>) {
  const current = yield* readActionValue(article);
  const auth = yield* BrowserAuth;
  return yield* auth.favoriteArticle(current.slug, current.favorited);
});

const followAuthor = <E, R>(article: RefSubject.Computed<Article, E, R>) =>
  EventHandler.make(
    (event: MouseEvent) =>
      toggleFollow(article).pipe(
        Effect.catch((error) => renderWorkflowFailure(targetForm(event), error)),
        Effect.asVoid,
      ),
    { preventDefault: true },
  );

const toggleFollow = Effect.fn(function* <E, R>(article: RefSubject.Computed<Article, E, R>) {
  const current = yield* readActionValue(article);
  const auth = yield* BrowserAuth;
  return yield* auth.followProfile(current.author.username, current.author.following);
});

const readActionValue = <A, E, R>(
  value: RefSubject.Computed<A, E, R>,
): Effect.Effect<A, FormTargetError, R> =>
  value.pipe(
    Effect.mapError(() => new FormTargetError({ reason: "reactive value is unavailable" })),
  );
