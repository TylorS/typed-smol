import type { RefSubject as RefSubjectType } from "@typed/fx/RefSubject/RefSubject";
import { Fx, RefSubject } from "@typed/fx";
import { html } from "@typed/template";
import { Link } from "@typed/ui";
import type { ProfileTabData } from "./profileTypes.js";

export const ProfileTab = Fx.fn("ProfileTab")((tabRef: RefSubjectType<ProfileTabData>) => {
  const tab = RefSubject.proxy(tabRef);
  const tabClass = RefSubject.map(tab.active, (active) => `nav-link${active ? " active" : ""}`);

  return html`<li class="nav-item">
    ${Link({ class: tabClass, href: tab.href, content: tab.label })}
  </li>`;
});
