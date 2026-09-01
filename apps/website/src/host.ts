import { NodeHttpServerRequest } from "@effect/platform-node";
import { Effect, Layer } from "effect";
import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
  HttpStaticServer,
} from "effect/unstable/http";
import { fileURLToPath } from "node:url";
import type { ViteDevServer } from "vite";

export function makeHost<A, E, R>(routes: Layer.Layer<A, E, R>, existingVite?: ViteDevServer) {
  return import.meta.env.DEV
    ? Layer.unwrap(
        Effect.map(scopedVite(existingVite), (vite) =>
          HttpRouter.serve(routes, { middleware: viteMiddleware(vite) }),
        ),
      )
    : HttpRouter.serve(
        Layer.merge(
          routes,
          HttpStaticServer.layer({ root: productionClientRoot, cacheControl: "no-cache" }),
        ),
        { middleware: withSiteBase },
      );
}

const productionClientRoot = fileURLToPath(new URL("../client", import.meta.url));

function scopedVite(vite: ViteDevServer | undefined) {
  if (vite === undefined) {
    throw new Error("The development host requires a Vite server");
  }
  return Effect.acquireRelease(Effect.succeed(vite), (vite) => Effect.promise(() => vite.close()));
}

function viteMiddleware(vite: ViteDevServer) {
  return <E, R>(
    app: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>,
  ): Effect.Effect<
    HttpServerResponse.HttpServerResponse,
    E,
    R | HttpServerRequest.HttpServerRequest
  > =>
    Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const incoming = NodeHttpServerRequest.toIncomingMessage(request);
      const response = NodeHttpServerRequest.toServerResponse(request);

      return yield* Effect.callback<
        HttpServerResponse.HttpServerResponse,
        E,
        R | HttpServerRequest.HttpServerRequest
      >((resume) => {
        let settled = false;
        const cleanup = () => response.off("finish", onFinish);
        const onFinish = () => {
          if (settled) return;
          settled = true;
          cleanup();
          resume(Effect.succeed(HttpServerResponse.empty()));
        };

        response.once("finish", onFinish);
        vite.middlewares(incoming, response, (error?: unknown) => {
          if (settled) return;
          settled = true;
          cleanup();
          resume(error == null ? withSiteBase(app) : Effect.die(error));
        });

        return Effect.sync(cleanup);
      });
    });
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/u, "");

const withSiteBase = <E, R>(
  effect: Effect.Effect<HttpServerResponse.HttpServerResponse, E, R>,
): Effect.Effect<HttpServerResponse.HttpServerResponse, E, R | HttpServerRequest.HttpServerRequest> =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const url = stripBasePath(request.url);
    return yield* (url === request.url
      ? effect
      : effect.pipe(
          Effect.provideService(HttpServerRequest.HttpServerRequest, request.modify({ url })),
        ));
  });

const stripBasePath = (url: string): string => {
  if (basePath === "" || !url.startsWith(basePath)) return url;
  const next = url.slice(basePath.length);
  return next.startsWith("/") ? next : `/${next}`;
};
