/**
 * Combined demo entrypoint: router + HttpApi virtual modules.
 * Resolves router:./routes and api:./api when TS plugin loads bundled plugins.
 */
import { NodeRuntime } from "@effect/platform-node";
import { HtmlRenderTemplate } from "@typed/template";
import { ssrForHttp } from "@typed/ui";
import * as Api from "api:api";
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import Routes from "router:routes";

Api.serve({}, HttpRouter.use(ssrForHttp(Routes))).pipe(
  Layer.provide(HtmlRenderTemplate),
  Layer.launch,
  NodeRuntime.runMain,
);
