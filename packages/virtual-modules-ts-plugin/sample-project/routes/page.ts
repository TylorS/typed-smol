import { RouteHandler } from "@typed/app";
import * as Route from "@typed/router";
import { html } from "@typed/template";

export const route = Route.Parse("page");
export const handler = RouteHandler(route)(() => html`<div>page</div>`);
