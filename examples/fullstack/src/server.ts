import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Ids } from "@typed/id";
import { HtmlRenderTemplate } from "@typed/template";
import { handleHttpServerError, ssrForHttp } from "@typed/ui";
import { Effect, Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import * as Http from "node:http";
import type { ViteDevServer } from "vite";
import { routes } from "./app.js";
import { makeHost } from "./host.js";

export interface ServerOptions {
  readonly port: number;
  readonly vite?: ViteDevServer;
}

const HttpRoutes = HttpRouter.use(
  Effect.fn(function* (router) {
    yield* ssrForHttp(router, routes);
    yield* handleHttpServerError(router);
  }),
).pipe(Layer.provide(HtmlRenderTemplate));

export const runServer = (options: ServerOptions) =>
  makeHost(HttpRoutes, options.vite).pipe(
    Layer.provideMerge([Ids.Default, NodeHttpServer.layer(Http.createServer, options)]),
    Layer.launch,
    NodeRuntime.runMain,
  );

if (import.meta.env.PROD) {
  runServer({ port: import.meta.env.PORT ? Number(import.meta.env.PORT) : 3000 });
}
