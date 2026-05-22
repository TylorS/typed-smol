import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

export const ArticleTag = Fx.fn("ArticleTag")(
  <A extends string>(tag: RefSubjectType<A>) =>
    html`<li class="tag-default tag-pill tag-outline">${tag}</li>`,
);
