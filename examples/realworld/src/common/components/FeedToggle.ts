import { Fx, RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";
import { Link } from "@typed/ui";
import { SelectedTagTab } from "./SelectedTagTab.js";
import type { FeedPageInput } from "./feedTypes.js";

export const FeedToggle = Fx.fn("FeedToggle")(<E, R>(
  inputRef: RefSubject.Computed<FeedPageInput, E, R>,
) => {
  const input = RefSubject.proxy(inputRef);
  const selectedTag = input.selectedTag ?? RefSubject.map(input.page, () => undefined);
  const globalFeedClass = RefSubject.map(selectedTag, (tag) => `nav-link${tag ? "" : " active"}`);
  const selectedTags = RefSubject.map(selectedTag, (tag) => tag ? [tag] : []);

  return html`<div class="feed-toggle">
  <ul class="nav nav-pills outline-active">
    <li class="nav-item"><a class="nav-link disabled">Your Feed</a></li>
    <li class="nav-item">
      ${Link({ class: globalFeedClass, href: "/", content: "Global Feed" })}
    </li>
    ${many(selectedTags, (tag) => tag, SelectedTagTab)}
  </ul>
</div>`;
});
