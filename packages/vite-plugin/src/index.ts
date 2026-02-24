/**
 * @typed/vite-plugin — One-stop Vite preset: tsconfig paths, bundle analyzer,
 * Brotli compression, virtual-modules Vite plugin, and @typed/app VM plugins.
 */
import type { Plugin } from "vite";
import type { CreateTypeInfoApiSession, VirtualModuleResolver } from "@typed/virtual-modules";
import { PluginManager } from "@typed/virtual-modules";
import {
  createHttpApiVirtualModulePlugin,
  createRouterVirtualModulePlugin,
} from "@typed/app";
import { virtualModulesVitePlugin } from "@typed/virtual-modules-vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

/**
 * Options passed through to the HttpApi virtual-module plugin when enabled.
 * Forwarded to createHttpApiVirtualModulePlugin from the package that provides it
 * (e.g. @typed/app when the export is added). See httpapi-virtual-module-plugin spec.
 */
export interface HttpApiVirtualModulePluginOptions {
  readonly [key: string]: unknown;
}

/** Options for vite-plugin-compression when compression is enabled. */
export type TypedViteCompressionOptions =
  | boolean
  | {
      readonly algorithm?: "gzip" | "brotliCompress" | "deflate" | "deflateRaw";
      readonly ext?: string;
      readonly threshold?: number;
      readonly [key: string]: unknown;
    };

export interface TypedVitePluginOptions {
  /**
   * Options for the router VM plugin from @typed/app.
   */
  readonly routerVmOptions?: import("@typed/app").RouterVirtualModulePluginOptions;

  /**
   * When set, enables the HttpApi virtual-module plugin and forwards these options to it.
   * Requires createHttpApiVirtualModulePlugin to be exported from @typed/app (or the
   * configured provider). Order: router VM plugin is registered first, then HttpApi VM plugin.
   */
  readonly apiVmOptions?: HttpApiVirtualModulePluginOptions;

  /**
   * Session factory for TypeInfo API (required for router VM type-checking).
   */
  readonly createTypeInfoApiSession?: CreateTypeInfoApiSession;

  /**
   * Enable tsconfig path resolution. Default true.
   */
  readonly tsconfigPaths?: boolean | Record<string, unknown>;

  /**
   * Enable bundle analyzer. Default: process.env.ANALYZE === '1'.
   */
  readonly analyze?: boolean | { filename?: string; open?: boolean; template?: string };

  /**
   * When true, virtual module resolution errors are logged. Default true.
   */
  readonly warnOnError?: boolean;

  /**
   * Enable Brotli compression for build. Default true.
   * Set false to disable, or pass options to customize (algorithm, ext, threshold).
   */
  readonly compression?: TypedViteCompressionOptions;
}

/** Optional dependency injection for createTypedViteResolver (e.g. for tests). */
export interface TypedViteResolverDependencies {
  createHttpApiVirtualModulePlugin?: (
    opts: HttpApiVirtualModulePluginOptions,
  ) => import("@typed/virtual-modules").VirtualModulePlugin;
}

/**
 * Builds the virtual-module resolver used by typedVitePlugin with deterministic plugin order:
 * 1) router VM plugin, 2) HttpApi VM plugin (when apiVmOptions is set).
 * Exported for tests that assert plugin order and options pass-through.
 * When `dependencies.createHttpApiVirtualModulePlugin` is provided (e.g. in tests), it overrides the direct import.
 */
export function createTypedViteResolver(
  options: TypedVitePluginOptions = {},
  dependencies?: TypedViteResolverDependencies,
): VirtualModuleResolver {
  const plugins: import("@typed/virtual-modules").VirtualModulePlugin[] = [
    createRouterVirtualModulePlugin(options.routerVmOptions ?? {}),
  ];
  if (options.apiVmOptions !== undefined) {
    const factory =
      dependencies?.createHttpApiVirtualModulePlugin ??
      createHttpApiVirtualModulePlugin;
    plugins.push(factory(options.apiVmOptions));
  }
  return new PluginManager(plugins);
}

/**
 * Returns Vite plugins: tsconfig paths, virtual modules (@typed/app), and optional bundle analyzer.
 * Use as: `defineConfig({ plugins: typedVitePlugin() })`.
 */
export function typedVitePlugin(options: TypedVitePluginOptions = {}): Plugin[] {
  const resolver = createTypedViteResolver(options);
  const analyze =
    options.analyze ?? (process.env.ANALYZE === "1" ? true : false);

  const plugins: Plugin[] = [];

  if (options.tsconfigPaths !== false) {
    const pathsOpts =
      typeof options.tsconfigPaths === "object" ? options.tsconfigPaths : {};
    plugins.push(tsconfigPaths(pathsOpts) as Plugin);
  }

  plugins.push(
    virtualModulesVitePlugin({
      resolver,
      createTypeInfoApiSession: options.createTypeInfoApiSession,
      warnOnError: options.warnOnError ?? true,
    }),
  );

  if (analyze) {
    const vizOpts =
      typeof analyze === "object"
        ? analyze
        : { filename: "dist/stats.html", template: "treemap" as const };
    plugins.push(
      visualizer({
        filename: vizOpts.filename ?? "dist/stats.html",
        open: vizOpts.open ?? false,
        template: (vizOpts.template as "treemap" | "sunburst" | "flamegraph" | "network") ?? "treemap",
      }) as Plugin,
    );
  }

  const compression = options.compression ?? true;
  if (compression !== false) {
    const compressionOpts =
      typeof compression === "object"
        ? {
            algorithm: "brotliCompress" as const,
            ext: ".br",
            threshold: 1024,
            ...compression,
          }
        : {
            algorithm: "brotliCompress" as const,
            ext: ".br",
            threshold: 1024,
          };
    plugins.push(viteCompression(compressionOpts) as Plugin);
  }

  return plugins;
}
