import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { ArticleList } from "./ArticleList.js";
import { FeedToggle } from "./FeedToggle.js";
import { TagSidebar } from "./TagSidebar.js";
import type { FeedPageInput } from "./feedTypes.js";

export const FeedContent = Fx.fn("FeedContent")(<E, R>(
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
});
