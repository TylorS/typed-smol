import { html } from "@typed/template";

export const TermLink = (id: string, label: string) =>
  html`<a class="term" href="/glossary#${id}">${label}</a>`;
