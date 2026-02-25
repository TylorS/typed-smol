/**
 * @typed/vite-plugin — One-stop Vite preset: tsconfig paths, bundle analyzer,
 * Brotli compression, virtual-modules Vite plugin, and @typed/app VM plugins.
 */
import type { Plugin } from "vite";
import type { CreateTypeInfoApiSession, VirtualModuleResolver } from "@typed/virtual-modules";
import {
  collectTypeTargetSpecsFromPlugins,
  createLanguageServiceSessionFactory,
  PluginManager,
} from "@typed/virtual-modules";
import {
  createHttpApiVirtualModulePlugin,
  createRouterVirtualModulePlugin,
} from "@typed/app";
import { virtualModulesVitePlugin } from "@typed/virtual-modules-vite";
import ts from "typescript";
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
   * Options for the HttpApi VM plugin from @typed/app. HttpApi VM plugin is always
   * registered (router first, then HttpApi). Use this to customize its behavior.
   */
  readonly apiVmOptions?: HttpApiVirtualModulePluginOptions;

  /**
   * Session factory for TypeInfo API. When not provided, a Language Service-backed
   * session is auto-created from the project's tsconfig (evolves as files change).
   * Override for custom session setup.
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
 * Invariant: ALL @typed/app VM plugins are always registered. There are no optional
 * or conditional app plugins. When adding a new VM plugin to @typed/app, add it here.
 */
export function createTypedViteResolver(
  options: TypedVitePluginOptions = {},
  dependencies?: TypedViteResolverDependencies,
): VirtualModuleResolver {
  const httpApiFactory =
    dependencies?.createHttpApiVirtualModulePlugin ??
    createHttpApiVirtualModulePlugin;
  const plugins: import("@typed/virtual-modules").VirtualModulePlugin[] = [
    createRouterVirtualModulePlugin(options.routerVmOptions ?? {}),
    httpApiFactory(options.apiVmOptions ?? {}),
  ];
  return new PluginManager(plugins);
}

/**
 * Returns Vite plugins: tsconfig paths, virtual modules (@typed/app), and optional bundle analyzer.
 * Use as: `defineConfig({ plugins: typedVitePlugin() })`.
 *
 * When createTypeInfoApiSession is not provided, the plugin automatically creates a
 * Language Service-backed session from the project's tsconfig. The type program evolves
 * as files change during dev. Pass createTypeInfoApiSession to override.
 */
export function typedVitePlugin(options: TypedVitePluginOptions = {}): Plugin[] {
  const resolver = createTypedViteResolver(options);
  const analyze =
    options.analyze ?? (process.env.ANALYZE === "1" ? true : false);

  let createTypeInfoApiSession: CreateTypeInfoApiSession | undefined =
    options.createTypeInfoApiSession;

  if (createTypeInfoApiSession === undefined) {
    try {
      const manager = resolver as PluginManager;
      const typeTargetSpecs = collectTypeTargetSpecsFromPlugins(manager.plugins);
      createTypeInfoApiSession = createLanguageServiceSessionFactory({
        ts,
        projectRoot: process.cwd(),
        typeTargetSpecs,
      });
    } catch {
      // Graceful degradation: no session, plugins get noop TypeInfoApi
    }
  }

  const plugins: Plugin[] = [];

  if (options.tsconfigPaths !== false) {
    const pathsOpts =
      typeof options.tsconfigPaths === "object" ? options.tsconfigPaths : {};
    plugins.push(tsconfigPaths(pathsOpts) as Plugin);
  }

  plugins.push(
    virtualModulesVitePlugin({
      resolver,
      createTypeInfoApiSession,
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
