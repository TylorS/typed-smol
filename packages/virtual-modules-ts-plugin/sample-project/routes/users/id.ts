import { RouteHandler } from "@typed/app";
import * as Route from "@typed/router";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

export const route = Route.Join(Route.Parse("users"), Route.Param("id"));
export const handler = RouteHandler(route)(
  (params) => html`<div>user-by-id: ${params.pipe(Fx.map((p) => p.id))}</div>`,
);
