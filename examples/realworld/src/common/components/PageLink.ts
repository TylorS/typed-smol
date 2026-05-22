import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Link } from "@typed/ui";
import type { PageLinkData } from "./feedTypes.js";

export const PageLink = Fx.fn("PageLink")((linkRef: RefSubjectType<PageLinkData>) => {
  const link = RefSubject.proxy(linkRef);
  const itemClass = RefSubject.map(link.active, (active) => `page-item${active ? " active" : ""}`);
  const ariaCurrent = RefSubject.map(link.active, (active) => active ? "page" : null);

  return html`<li class=${itemClass}>
    ${Link({ class: "page-link", href: link.href, "aria-current": ariaCurrent, content: link.page })}
  </li>`;
});
