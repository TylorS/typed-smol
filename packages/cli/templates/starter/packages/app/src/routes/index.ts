import * as Route from "@typed/router";
import { html } from "@typed/template";
import { message } from "@__APP_NAME__/shared";

export const route = Route.Slash;
export const handler = () => html`<main id="home">${message}</main>`;
