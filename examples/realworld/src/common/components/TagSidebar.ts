import { Fx, RefSubject } from "@typed/fx";
import { html, many } from "@typed/template";
import { TagSidebarLink } from "./TagSidebarLink.js";

export const TagSidebar = Fx.fn("TagSidebar")(<E, R>(
  tags: RefSubject.Computed<readonly string[], E, R>,
) => html`<div class="sidebar">
  <p>Popular Tags</p>
  <div class="tag-list">${many(tags, (tag) => tag, TagSidebarLink)}</div>
</div>`);
