/**
 * @typed/vite-plugin — One-stop Vite preset: tsconfig paths, bundle analyzer,
 * Brotli compression, virtual-modules Vite plugin, and @typed/app VM plugins.
 */
import type { TypedConfig } from "@typed/app";
import {
  createHttpApiVirtualModulePlugin,
  createRouterVirtualModulePlugin,
  HttpApiVirtualModulePluginOptions,
  loadTypedConfig,
  RouterVirtualModulePluginOptions,
} from "@typed/app";
import type { CreateTypeInfoApiSession, VirtualModuleResolver } from "@typed/virtual-modules";
import {
  collectTypeTargetSpecsFromPlugins,
  createLanguageServiceSessionFactory,
  PluginManager,
} from "@typed/virtual-modules";
import { virtualModulesVitePlugin } from "@typed/virtual-modules-vite";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { visualizer } from "rollup-plugin-visualizer";
import ts from "typescript";
import type { Plugin } from "vite";
import viteCompression from "vite-plugin-compression";
import tsconfigPaths from "vite-tsconfig-paths";

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
  readonly routerVmOptions?: RouterVirtualModulePluginOptions;

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
   * Path to tsconfig.json (relative to cwd or absolute). When set, both the
   * Language Service session and vite-tsconfig-paths use this tsconfig.
   * Default: auto-discovered from project root.
   */
  readonly tsconfig?: string;

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
    dependencies?.createHttpApiVirtualModulePlugin ?? createHttpApiVirtualModulePlugin;
  const plugins: import("@typed/virtual-modules").VirtualModulePlugin[] = [
    createRouterVirtualModulePlugin(options.routerVmOptions ?? {}),
    httpApiFactory(options.apiVmOptions ?? {}),
  ];
  return new PluginManager(plugins);
}

function optionsFromTypedConfig(config: TypedConfig): TypedVitePluginOptions {
  return {
    routerVmOptions: config.router ? { prefix: config.router.prefix } : undefined,
    apiVmOptions: config.api
      ? { prefix: config.api.prefix, pathPrefix: config.api.pathPrefix }
      : undefined,
    tsconfig: config.tsconfig,
    tsconfigPaths: config.tsconfigPaths,
    analyze: config.analyze,
    warnOnError: config.warnOnError,
    compression: config.compression,
  };
}

/**
 * Returns Vite plugins: tsconfig paths, virtual modules (@typed/app), and optional bundle analyzer.
 * Use as: `defineConfig({ plugins: typedVitePlugin() })`.
 *
 * When called with no arguments, auto-discovers `typed.config.ts` in the project root.
 * When called with explicit options, those take full precedence (config file is not loaded).
 */
export function typedVitePlugin(options?: TypedVitePluginOptions): Plugin[] {
  const resolvedOptions: TypedVitePluginOptions = (() => {
    if (options) return options;
    const result = loadTypedConfig({ projectRoot: process.cwd(), ts });
    if (result.status === "loaded") return optionsFromTypedConfig(result.config);
    return {};
  })();

  const resolver = createTypedViteResolver(resolvedOptions);
  const analyze = resolvedOptions.analyze ?? (process.env.ANALYZE === "1" ? true : false);

  let createTypeInfoApiSession: CreateTypeInfoApiSession | undefined =
    resolvedOptions.createTypeInfoApiSession;

  if (createTypeInfoApiSession === undefined) {
    try {
      const manager = resolver as PluginManager;
      const typeTargetSpecs = collectTypeTargetSpecsFromPlugins(manager.plugins);
      const cwd = process.cwd();
      const tsconfigPath = resolvedOptions.tsconfig
        ? resolve(cwd, resolvedOptions.tsconfig)
        : undefined;
      const projectRoot = tsconfigPath ? dirname(tsconfigPath) : cwd;
      createTypeInfoApiSession = createLanguageServiceSessionFactory({
        ts,
        projectRoot,
        typeTargetSpecs,
        tsconfigPath,
      });
    } catch {
      // Graceful degradation: no session, plugins get noop TypeInfoApi
    }
  }

  const plugins: Plugin[] = [];

  if (resolvedOptions.tsconfigPaths !== false) {
    const basePathsOpts =
      typeof resolvedOptions.tsconfigPaths === "object" ? resolvedOptions.tsconfigPaths : {};
    const cwd = process.cwd();
    const resolvedTsconfig = resolvedOptions.tsconfig
      ? resolve(cwd, resolvedOptions.tsconfig)
      : undefined;
    const pathsOpts =
      resolvedTsconfig !== undefined
        ? {
            ...basePathsOpts,
            root: cwd,
            projects: [relative(cwd, resolvedTsconfig)],
          }
        : basePathsOpts;
    plugins.push(tsconfigPaths(pathsOpts) as Plugin);
  }

  plugins.push(
    virtualModulesVitePlugin({
      resolver,
      createTypeInfoApiSession,
      warnOnError: resolvedOptions.warnOnError ?? true,
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
        template:
          (vizOpts.template as "treemap" | "sunburst" | "flamegraph" | "network") ?? "treemap",
      }) as Plugin,
    );
  }

  const compression = resolvedOptions.compression ?? true;
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
