import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Link } from "@typed/ui";

export const SelectedTagTab = Fx.fn("SelectedTagTab")(<A extends string>(
  tag: RefSubject.RefSubject<A>,
) => {
  const href = RefSubject.map<A, never, never, string>(tag, tagHref);
  return html`<li class="nav-item">
    ${Link({ class: "nav-link active", href, content: html`# ${tag}` })}
  </li>`;
});

const tagHref = (value: string): string => `/tag/${value}`;
