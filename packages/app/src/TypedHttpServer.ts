import { NodeHttpServer } from "@effect/platform-node";
import * as Layer from "effect/Layer";
import * as HttpStaticServer from "effect/unstable/http/HttpStaticServer";
import { createServer } from "node:http";
import { createServer as createHttpsServer } from "node:https";
import { readFileSync } from "node:fs";
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
} as const;
