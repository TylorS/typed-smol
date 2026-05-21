/**
 * Combined demo entrypoint: router + HttpApi virtual modules.
 * Resolves typed:router?dir=./routes and typed:api?dir=./api when TS plugin loads bundled plugins.
 */
import { HtmlRenderTemplate } from "@typed/template";
import { ssrForHttp } from "@typed/ui";
import * as Api from "typed:api?dir=api";
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import Routes from "typed:router?dir=routes";

export const ServerLayer = Api.serve({}, HttpRouter.use(ssrForHttp(Routes))).pipe(
  Layer.provide(HtmlRenderTemplate),
);
export const program = Layer.launch(ServerLayer);
