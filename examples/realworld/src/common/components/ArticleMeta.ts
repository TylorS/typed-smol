import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Link } from "@typed/ui";
import type { Article } from "../../domain/Article.js";
import { safeTextPreview } from "../../domain/Markdown.js";
import { avatarSrc } from "../Layout.js";

export const ArticleMeta = Fx.fn("ArticleMeta")(<E, R>(
  articleRef: RefSubject.Computed<Article, E, R>,
) => {
  const article = RefSubject.proxy(articleRef);
  const author = RefSubject.proxy(article.author);
  const profileHref = RefSubject.map(author.username, (value) => `/profile/${value}`);
  const avatar = RefSubject.map(author.image, avatarSrc);
  const displayName = RefSubject.map(author.username, safeTextPreview);

  return html`${Link({ href: profileHref, content: html`<img src=${avatar} />` })}
    <div class="info">
      ${Link({ class: "author", href: profileHref, content: displayName })}
      <span class="date">${article.createdAt}</span>
    </div> `;
});
