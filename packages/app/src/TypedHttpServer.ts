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

export interface TypedHttpServerLayer {
  readonly _tag: "TypedHttpServerLayer";
  readonly host: string | undefined;
  readonly port: number | undefined;
  readonly mode: TypedHttpServerMode;
  readonly staticAssetRoot: string;
  readonly ssl: TypedHttpServerSsl;
}

export function resolveTypedHttpServerMode(
  options: ResolveTypedHttpServerModeOptions,
): TypedHttpServerMode {
  if (options.dev) return { kind: "dev", handler: options.vaviteHandler };
  return { kind: "node" };
}

export { inferStaticAssetRoot, resolveTypedHttpServerSsl };

export const TypedHttpServer = {
  layer(options: TypedHttpServerLayerOptions): TypedHttpServerLayer {
    return {
      _tag: "TypedHttpServerLayer",
      host: options.host,
      port: options.port,
      mode: resolveTypedHttpServerMode(options),
      staticAssetRoot: inferStaticAssetRoot({
        projectRoot: options.projectRoot,
        buildOutDir: options.buildOutDir,
      }),
      ssl: resolveTypedHttpServerSsl({ projectRoot: options.projectRoot, ssl: options.ssl }),
    };
  },
} as const;
