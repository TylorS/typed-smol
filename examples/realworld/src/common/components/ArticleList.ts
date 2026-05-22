import { Fx, RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";
import type { ArticlePreview } from "../../domain/Article.js";
import { ArticlePreviewCard } from "./ArticlePreviewCard.js";
import { EmptyFeedMessage } from "./EmptyFeedMessage.js";
import { Pagination } from "./Pagination.js";

export const ArticleList = Fx.fn("ArticleList")(<E, R>(input: {
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
});
