import * as Route from "@typed/router";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";
import { message } from "@__APP_NAME__/shared";
import type { Handler } from "./$route-types";

export const route = Route.Slash;
export const template = Fx.fn("Home")(function* () {
  return html`<main id="home">${message}</main>`;
}) satisfies Handler;
