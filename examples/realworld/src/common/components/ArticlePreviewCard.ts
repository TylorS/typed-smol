import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { Fx, RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";
import { Link } from "@typed/ui";
import type { ArticlePreview } from "../../domain/Article.js";
import { safeTextPreview } from "../../domain/Markdown.js";
import { AuthorMeta } from "./AuthorMeta.js";
import { FeedTag } from "./FeedTag.js";

export const ArticlePreviewCard = Fx.fn("ArticlePreviewCard")((
  articleRef: RefSubjectType<ArticlePreview>,
) => {
  const article = RefSubject.proxy(articleRef);
  const href = RefSubject.map(article.slug, (slug) => `/article/${slug}`);
  const title = RefSubject.map(article.title, safeTextPreview);
  const description = RefSubject.map(article.description, safeTextPreview);

  return html`<article class="article-preview">
    <div class="article-meta">${AuthorMeta(articleRef)}</div>
    ${Link({
      class: "preview-link",
      href,
      content: html`<h1>${title}</h1>
        <p>${description}</p>
        <span>Read more...</span>
        <ul class="tag-list">
          ${many(article.tagList, (tag) => tag, FeedTag)}
        </ul>`,
    })}
  </article>`;
});
