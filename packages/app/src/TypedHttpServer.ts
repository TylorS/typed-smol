import { NodeHttpServer } from "@effect/platform-node";
import * as Layer from "effect/Layer";
import * as HttpStaticServer from "effect/unstable/http/HttpStaticServer";
import { createServer } from "node:http";
import type { IncomingMessage, RequestListener, ServerResponse } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { readFileSync } from "node:fs";
import { Readable, Writable } from "node:stream";
import * as HttpRouter from "effect/unstable/http/HttpRouter";
import { inferStaticAssetRoot } from "./internal/staticAssets.js";
import {
  resolveTypedHttpServerSsl,
  type TypedHttpServerSsl,
  type TypedHttpServerSslInput,
} from "./internal/ssl.js";

export type TypedHttpServerMode =
  | { readonly kind: "dev"; readonly handler: unknown }
  | { readonly kind: "node" };

export interface ResolveTypedHttpServerModeOptions {
  readonly dev: boolean;
  readonly vaviteHandler?: unknown;
}

export interface TypedHttpServerLayerOptions {
  readonly projectRoot: string;
  readonly dev: boolean;
  readonly vaviteHandler?: unknown;
  readonly buildOutDir?: string;
  readonly host?: string;
  readonly port?: number;
  readonly ssl?: TypedHttpServerSslInput;
}

export interface TypedHttpServerStaticAssetsOptions {
  readonly projectRoot: string;
  readonly dev: boolean;
  readonly buildOutDir?: string;
  readonly prefix?: string;
  readonly spa?: boolean;
  readonly cacheControl?: string;
}

export type TypedNodeHandler = RequestListener & {
  readonly dispose: () => Promise<void>;
};

export function resolveTypedHttpServerMode(
  options: ResolveTypedHttpServerModeOptions,
): TypedHttpServerMode {
  if (options.dev) return { kind: "dev", handler: options.vaviteHandler };
  return { kind: "node" };
}

export { inferStaticAssetRoot, resolveTypedHttpServerSsl };

export const TypedHttpServer = {
  layer(options: TypedHttpServerLayerOptions) {
    const ssl = resolveTypedHttpServerSsl({ projectRoot: options.projectRoot, ssl: options.ssl });
    const listenOptions = { host: options.host, port: options.port };
    if (ssl.kind === "disabled") return NodeHttpServer.layer(createServer, listenOptions);
    return NodeHttpServer.layer(
      () =>
        createHttpsServer({
          key: readFileSync(ssl.key),
          cert: readFileSync(ssl.cert),
        }) as any,
      listenOptions,
    );
  },

  staticAssets(options: TypedHttpServerStaticAssetsOptions) {
    if (options.dev) return Layer.empty;
    return HttpStaticServer.layer({
      root: inferStaticAssetRoot({
        projectRoot: options.projectRoot,
        buildOutDir: options.buildOutDir,
      }),
      prefix: options.prefix,
      spa: options.spa ?? true,
      cacheControl: options.cacheControl,
    });
  },

  toNodeHandler(appLayer: Layer.Layer<any, any, any>): TypedNodeHandler {
    const provided = appLayer.pipe(Layer.provide(NodeHttpServer.layerHttpServices as any));
    const webHandler = HttpRouter.toWebHandler(provided as any);
    const handler = ((request, response, next?: (error?: unknown) => void) => {
      void webHandler
        .handler(toRequest(request))
        .then((webResponse) => writeResponse(response, webResponse))
        .catch((error) => {
          if (next) return next(error);
          response.statusCode = 500;
          response.end(error instanceof Error ? error.message : "Internal Server Error");
        });
    }) as TypedNodeHandler;
    Object.defineProperty(handler, "dispose", {
      value: webHandler.dispose,
      enumerable: true,
    });
    return handler;
  },
} as const;

function toRequest(request: IncomingMessage): Request {
  const method = request.method ?? "GET";
  const protocol = (request.socket as { encrypted?: boolean }).encrypted ? "https" : "http";
  const host = request.headers.host ?? "localhost";
  const url = new URL(request.url ?? "/", `${protocol}://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
      continue;
    }
    headers.set(key, value);
  }
  const hasBody = method !== "GET" && method !== "HEAD";
  return new Request(url, {
    method,
    headers,
    body: hasBody ? (Readable.toWeb(request) as ReadableStream) : undefined,
    duplex: hasBody ? "half" : undefined,
  } as RequestInit & { duplex?: "half" });
}

async function writeResponse(response: ServerResponse, webResponse: Response): Promise<void> {
  response.statusCode = webResponse.status;
  response.statusMessage = webResponse.statusText;
  webResponse.headers.forEach((value, key) => response.setHeader(key, value));
  if (!webResponse.body) {
    response.end();
    return;
  }
  await webResponse.body.pipeTo(Writable.toWeb(response) as WritableStream);
}
