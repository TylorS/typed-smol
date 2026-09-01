import { html } from "@typed/template";
import { siteHref } from "../SiteHref.js";

export const TermLink = (id: string, label: string) =>
  html`<a class="term" href=${siteHref(`/glossary#${id}`)}>${label}</a>`;
