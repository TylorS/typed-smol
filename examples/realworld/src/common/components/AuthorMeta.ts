import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { Fx, RefSubject } from "@typed/fx";
import { EventHandler, html } from "@typed/template";
import { Button, Link } from "@typed/ui";
import * as Effect from "effect/Effect";
import type { ArticlePreview } from "../../domain/Article.js";
import { safeTextPreview } from "../../domain/Markdown.js";
import { avatarSrc } from "../Layout.js";
import { BrowserAuth } from "../BrowserAuth.js";
import { renderWorkflowFailure, targetForm } from "../workflowErrors.js";

export const AuthorMeta = Fx.fn("AuthorMeta")((articleRef: RefSubjectType<ArticlePreview>) => {
  const { author, favoritesCount } = RefSubject.proxy(articleRef);
  const { username, image } = RefSubject.proxy(author);
  const profileHref = RefSubject.map(username, (value) => `/profile/${value}`);
  const avatar = RefSubject.map(image, avatarSrc);
  const displayName = RefSubject.map(username, safeTextPreview);

  return html`${Link({ href: profileHref, content: html`<img src=${avatar} />` })}
    <div class="info">
      ${Link({ class: "author", href: profileHref, content: displayName })}
      <span class="date">${RefSubject.proxy(articleRef).createdAt}</span>
    </div>
    ${Button.Button({
      content: html`Favorite ${favoritesCount}`,
      onclick: favoriteArticle(articleRef),
      props: { class: "btn btn-outline-primary btn-sm" },
    })}`;
});

const favoriteArticle = (article: RefSubjectType<ArticlePreview>) =>
  EventHandler.make(
    (event: MouseEvent) =>
      toggleFavorite(article).pipe(
        Effect.catch((error) => renderWorkflowFailure(targetForm(event), error)),
        Effect.asVoid,
      ),
    { preventDefault: true },
  );

const toggleFavorite = Effect.fn(function* (article: RefSubjectType<ArticlePreview>) {
  const { favorited, slug } = yield* article;
  const auth = yield* BrowserAuth;
  return yield* auth.favoriteArticle(slug, favorited);
});
