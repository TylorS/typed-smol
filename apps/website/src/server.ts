import { NodeHttpServer, NodeRuntime } from "@effect/platform-node";
import { Ids } from "@typed/id";
import { HtmlRenderTemplate } from "@typed/template";
import { handleHttpServerError, ssrForHttp } from "@typed/ui";
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import * as Http from "node:http";
import { parseArgs } from "node:util";
import type { ViteDevServer } from "vite";
import { routes } from "./app.js";
import { AgentHttpRoutes } from "./agent/Http.js";
import { makeHost } from "./host.js";

export interface ServerOptions {
  readonly port: number;
  readonly vite?: ViteDevServer;
}

const HttpRoutes = Layer.mergeAll(AgentHttpRoutes, HttpRouter.use(ssrForHttp(routes))).pipe(
  Layer.provide(HttpRouter.use(handleHttpServerError)),
  Layer.provide(HtmlRenderTemplate),
);

export const runServer = (options: ServerOptions) => {
  const server = makeHost(HttpRoutes, options.vite).pipe(
    Layer.provide(Ids.Default),
    Layer.provide(NodeHttpServer.layer(Http.createServer, options)),
    Layer.launch,
  );
  return NodeRuntime.runMain(server);
};

if (import.meta.env.PROD) {
  const { values } = parseArgs({ options: { port: { type: "string" } } });
  runServer({ port: values.port === undefined ? 3000 : Number(values.port) });
}
