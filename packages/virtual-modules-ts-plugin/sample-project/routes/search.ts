import { RouteHandler } from "@typed/app";
import * as Route from "@typed/router";
import { html } from "@typed/template";

export const route = Route.Parse("search");
export const handler = RouteHandler(route)(() => html`<div>search-result</div>`);
