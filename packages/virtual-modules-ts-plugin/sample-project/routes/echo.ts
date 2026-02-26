import { RouteHandler } from "@typed/app";
import * as Route from "@typed/router";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

export const route = Route.Parse("echo");
export const handler = RouteHandler(route)((params) =>
  html`<pre>${params.pipe(Fx.map((p) => JSON.stringify(p)))}</pre>`,
);
