import { html } from "@typed/template";
import { Navbar } from "../presentation/Layout.js";

export const layout = ({ content }: { readonly content: unknown }) =>
  html`<main class="app-shell" data-page="realworld">${Navbar} ${content}</main>`;
