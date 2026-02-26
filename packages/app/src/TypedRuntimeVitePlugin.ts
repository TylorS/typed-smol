/**
 * Vite plugin for typed-smol runtime virtual modules:
 * - typed:config — resolved typed.config.ts (serializable)
 * - typed:vite-dev-server — Vite dev server instance (dev only)
 */
import { loadTypedConfig } from "./config/loadTypedConfig.js";
import type { TypedConfig } from "./config/TypedConfig.js";
import ts from "typescript";
import type { Plugin } from "vite";

export interface TypedRuntimeVitePluginOptions {
  /** Pre-loaded config. When omitted, loads from projectRoot. */
  readonly config?: TypedConfig;
  /** Project root for config discovery. Default: process.cwd() */
  readonly projectRoot?: string;
}

function toSerializable(config: TypedConfig): Record<string, unknown> {
  return JSON.parse(JSON.stringify(config));
}

/**
 * Creates the typed runtime Vite plugin for typed:config and typed:vite-dev-server.
 */
export function createTypedRuntimeVitePlugin(options: TypedRuntimeVitePluginOptions = {}): Plugin {
  const projectRoot = options.projectRoot ?? process.cwd();
  let resolvedConfig: Record<string, unknown> | null = null;

  return {
    name: "typed:runtime",
    enforce: "pre",
    configResolved() {
      if (options.config) {
        resolvedConfig = toSerializable(options.config);
      } else {
        const result = loadTypedConfig({ projectRoot, ts });
        if (result.status === "loaded") {
          resolvedConfig = toSerializable(result.config);
        } else {
          resolvedConfig = {};
        }
      }
    },
    configureServer(server: import("vite").ViteDevServer) {
      Object.assign(globalThis, {
        __TYPED_VITE_DEV_SERVER__: server,
      });
    },
    resolveId(id: string) {
      if (id === "typed:config" || id === "typed:vite-dev-server") {
        return "\0" + id;
      }
      return null;
    },
    load(id: string) {
      if (id === "\0typed:config") {
        const config = resolvedConfig ?? {};
        return `export default ${JSON.stringify(config)};`;
      }
      if (id === "\0typed:vite-dev-server") {
        return `export default  globalThis.__TYPED_VITE_DEV_SERVER__;`;
      }
      return null;
    },
  };
}
