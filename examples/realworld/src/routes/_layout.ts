import type { Fx } from "@typed/fx/Fx/Fx";
import type { LayoutParams } from "@typed/router";
import { html, type RenderEvent, type RenderTemplate } from "@typed/template";
import type { Scope } from "effect/Scope";
import { Navbar } from "../common/components/Navbar.js";

export const layout = <Params, A, E, R>({
  content,
}: LayoutParams<Params, A, E, R>): Fx<RenderEvent, E, R | Scope | RenderTemplate> =>
  html`<main class="app-shell" data-page="realworld">${Navbar} ${content}</main>`;
