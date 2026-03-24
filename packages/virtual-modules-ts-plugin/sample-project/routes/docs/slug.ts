import { RouteHandler } from "@typed/app";
import * as Route from "@typed/router";
import { Fx } from "@typed/fx";
import { html } from "@typed/template";

export const route = Route.Join(Route.Parse("docs"), Route.Param("slug"));
export const handler = RouteHandler(route)(
  (params) => html`<div>doc-by-slug: ${params.pipe(Fx.map((p) => p.slug))}</div>`,
);
