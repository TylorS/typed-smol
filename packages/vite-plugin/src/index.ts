/**
 * @typed/vite-plugin — One-stop Vite preset: tsconfig paths, bundle analyzer,
 * Brotli compression, virtual-modules Vite plugin, and @typed/app VM plugins.
 */
import { type BrowserVirtualModulePluginOptions } from "@typed/app/BrowserVirtualModulePlugin";
import { type ComponentVirtualModulePluginOptions } from "@typed/app/ComponentVirtualModulePlugin";
import { type HtmlVirtualModulePluginOptions } from "@typed/app/HtmlVirtualModulePlugin";
import { type HttpApiVirtualModulePluginOptions } from "@typed/app/HttpApiVirtualModulePlugin";
import { type RouterVirtualModulePluginOptions } from "@typed/app/RouterVirtualModulePlugin";
import { type StorybookVirtualModulePluginOptions } from "@typed/app/StorybookVirtualModulePlugin";
import { createTypedVirtualModulePlugins } from "@typed/app/TypedVirtualModulePlugins";
import type { TypedConfig } from "@typed/app/config/TypedConfig";
import { findTypedConfigRoot, loadTypedConfig } from "@typed/app/config/loadTypedConfig";
import { typedTemplateVitePlugin, type TypedTemplateVitePluginOptions } from "@typed/compiler";
import type { CreateTypeInfoApiSession, VirtualModuleResolver } from "@typed/virtual-modules";
import {
  collectTypeTargetSpecsFromPlugins,
  createLanguageServiceSessionFactory,
  PluginManager,
} from "@typed/virtual-modules";
import { virtualModulesVitePlugin } from "@typed/virtual-modules-vite";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { visualizer } from "rollup-plugin-visualizer";
import ts from "typescript";
import type { Plugin } from "vite";
import viteCompression from "vite-plugin-compression";
import { createTypedVavitePlugin } from "./vaviteIntegration.js";

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
   * Project root used for typed.config.ts and tsconfig-relative paths.
   * Defaults to the nearest typed.config.ts directory, then process.cwd().
   */
  readonly projectRoot?: string;

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
   * Options for the HTML shell VM plugin from @typed/app.
   */
  readonly htmlVmOptions?: HtmlVirtualModulePluginOptions;

  /**
   * Options for the browser runtime VM plugin from @typed/app.
   */
  readonly browserVmOptions?: BrowserVirtualModulePluginOptions;

  /**
   * Options for the component VM plugin from @typed/app.
   */
  readonly componentVmOptions?: ComponentVirtualModulePluginOptions;

  /**
   * Options for the Storybook VM plugin from @typed/app. Storybook presets use this
   * to provide short-import runtime defaults.
   */
  readonly storybookVmOptions?: StorybookVirtualModulePluginOptions;

  /**
   * Session factory for TypeInfo API. When not provided, a Language Service-backed
   * session is auto-created from the project's tsconfig (evolves as files change).
   * Override for custom session setup.
   */
  readonly createTypeInfoApiSession?: CreateTypeInfoApiSession;

  /**
   * Path to tsconfig.json (relative to cwd or absolute). Used by the Language
   * Service session. Vite's native resolve.tsconfigPaths discovers tsconfig.json.
   * Default: auto-discovered from project root.
   */
  readonly tsconfig?: string;

  /**
   * Enable tsconfig path resolution. Default true.
   */
  readonly tsconfigPaths?: boolean;

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

  /**
   * Server entry used to enable vavite runnable-handler integration.
   * When options are loaded from typed.config.ts this is sourced from config.entry.
   * Set false to force-disable vavite integration.
   */
  readonly serverEntry?: string | false;

  /**
   * Enable direct Typed template transforms before virtual modules. Default true.
   * Set false to preserve interpreted template behavior without compiler transforms.
   */
  readonly templates?: boolean | TypedTemplateVitePluginOptions;
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
  const plugins = createTypedVirtualModulePlugins({
    router: options.routerVmOptions,
    api: options.apiVmOptions,
    html: options.htmlVmOptions,
    browser: options.browserVmOptions,
    component: options.componentVmOptions,
    storybook: options.storybookVmOptions,
    createHttpApiVirtualModulePlugin: dependencies?.createHttpApiVirtualModulePlugin,
  });
  return new PluginManager(plugins);
}

function optionsFromTypedConfig(config: TypedConfig, projectRoot?: string): TypedVitePluginOptions {
  const routeDirectories = config.router?.routes;
  return {
    routerVmOptions: config.router ? { prefix: config.router.prefix } : undefined,
    apiVmOptions:
      config.api || config.openapi
        ? {
            prefix: config.api?.prefix,
            pathPrefix: config.api?.pathPrefix,
            openapi: config.openapi,
          }
        : undefined,
    htmlVmOptions: config.html
      ? { defaultPath: config.html.path, defaultOutlet: config.html.outlet }
      : undefined,
    browserVmOptions: browserOptionsFromConfig(config, routeDirectories),
    storybookVmOptions: storybookOptionsFromConfig(config, routeDirectories, projectRoot),
    tsconfig: config.tsconfig,
    tsconfigPaths: config.tsconfigPaths,
    analyze: config.analyze,
    warnOnError: config.warnOnError,
    compression: config.compression,
    serverEntry: config.entry,
    templates: templateOptionsFromConfig(config, routeDirectories),
  };
}

function browserOptionsFromConfig(
  config: TypedConfig,
  routeDirectories: readonly string[] | undefined,
): BrowserVirtualModulePluginOptions | undefined {
  if (!config.browser && !routeDirectories) return undefined;
  return {
    runtimeDefaults: {
      routes: config.browser?.routes ?? routeDirectories,
      root: config.browser?.root,
      base: config.browser?.base,
      mode: config.browser?.mode,
      name: config.browser?.name,
      devtools: process.env.VITE_TYPED_DEVTOOLS_SMOKE === "1",
    },
  };
}

function storybookOptionsFromConfig(
  config: TypedConfig,
  routeDirectories: readonly string[] | undefined,
  projectRoot: string | undefined,
): StorybookVirtualModulePluginOptions | undefined {
  if (!config.storybook && !routeDirectories && !projectRoot) return undefined;
  return {
    runtimeDefaults: {
      routes: config.storybook?.routes ?? routeDirectories,
      api: config.storybook?.api,
      proxyPath: config.storybook?.proxyPath,
      serverOrigin: config.storybook?.serverOrigin,
      baseDir: projectRoot,
    },
  };
}

function templateOptionsFromConfig(
  config: TypedConfig,
  routeDirectories: readonly string[] | undefined,
): boolean | TypedTemplateVitePluginOptions {
  if (config.templates === false) return false;
  const diagnostics =
    typeof config.templates === "object" ? config.templates.diagnostics : undefined;
  if (diagnostics || routeDirectories) return { diagnostics, routeDirectories };
  return true;
}

export function resolveTypedViteProjectRoot(startPath = process.cwd()): string {
  return findTypedConfigRoot(startPath) ?? resolve(startPath);
}

function loadTypedViteOptions(options: TypedVitePluginOptions | undefined): {
  readonly options: TypedVitePluginOptions;
  readonly projectRoot: string;
} {
  const fallbackRoot = options?.projectRoot ? resolve(options.projectRoot) : process.cwd();
  const projectRoot = resolveTypedViteProjectRoot(fallbackRoot);
  if (options) return { options, projectRoot };

  const result = loadTypedConfig({ projectRoot, ts });
  if (result.status === "loaded") {
    return {
      options: {
        ...optionsFromTypedConfig(result.config, dirname(result.path)),
        projectRoot: dirname(result.path),
      },
      projectRoot: dirname(result.path),
    };
  }

  return { options: {}, projectRoot };
}

/**
 * Returns Vite plugins: tsconfig paths, virtual modules (@typed/app), and optional bundle analyzer.
 * Use as: `defineConfig({ plugins: typedVitePlugin() })`.
 *
 * When called with no arguments, auto-discovers `typed.config.ts` in the project root.
 * When called with explicit options, those take full precedence (config file is not loaded).
 */
export function typedVitePlugin(options?: TypedVitePluginOptions): Plugin[] {
  const loaded = loadTypedViteOptions(options);
  const resolvedOptions = withDevtoolsSmokeMode(loaded.options);
  const projectRoot = loaded.projectRoot;

  const resolver = createTypedViteResolver(resolvedOptions);
  const analyze = resolvedOptions.analyze ?? (process.env.ANALYZE === "1" ? true : false);

  let createTypeInfoApiSession: CreateTypeInfoApiSession | undefined =
    resolvedOptions.createTypeInfoApiSession;

  if (createTypeInfoApiSession === undefined) {
    try {
      const manager = resolver as PluginManager;
      const typeTargetSpecs = collectTypeTargetSpecsFromPlugins(manager.plugins);
      const tsconfigPath = resolvedOptions.tsconfig
        ? resolve(projectRoot, resolvedOptions.tsconfig)
        : undefined;
      createTypeInfoApiSession = createLanguageServiceSessionFactory({
        ts,
        projectRoot: tsconfigPath ? dirname(tsconfigPath) : projectRoot,
        typeTargetSpecs,
        tsconfigPath,
      });
    } catch {
      // Graceful degradation: no session, plugins get noop TypeInfoApi
    }
  }

  const plugins: Plugin[] = [];

  if (resolvedOptions.tsconfigPaths !== false) {
    plugins.push(nativeTsconfigPathsPlugin);
  }

  if (resolvedOptions.templates !== false) {
    plugins.push(
      typedTemplateVitePlugin(
        typeof resolvedOptions.templates === "object" ? resolvedOptions.templates : {},
      ),
    );
  }

  plugins.push(
    virtualModulesVitePlugin({
      resolver,
      projectRoot,
      createTypeInfoApiSession,
      warnOnError: resolvedOptions.warnOnError ?? true,
      mapId: ({ id, consumer }) =>
        consumer === "client" ? withClientHttpApiMode(id, resolvedOptions.apiVmOptions) : id,
    }),
  );

  if (resolvedOptions.serverEntry) {
    plugins.push(...createTypedVavitePlugin({ serverEntry: resolvedOptions.serverEntry }));
  }

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

function withDevtoolsSmokeMode(options: TypedVitePluginOptions): TypedVitePluginOptions {
  if (process.env.VITE_TYPED_DEVTOOLS_SMOKE !== "1") return options;
  const browserVmOptions = options.browserVmOptions;
  return {
    ...options,
    browserVmOptions: {
      ...browserVmOptions,
      runtimeDefaults: {
        ...browserVmOptions?.runtimeDefaults,
        devtools: true,
      },
    },
  };
}

export const nativeTsconfigPathsPlugin: Plugin = {
  name: "typed-vite:native-tsconfig-paths",
  config(config) {
    config.resolve ??= {};
    config.resolve.tsconfigPaths ??= true;
  },
};

function withClientHttpApiMode(
  id: string,
  options: HttpApiVirtualModulePluginOptions | undefined,
): string {
  const prefix = options?.prefix ?? "typed:api";
  if (id !== prefix && !id.startsWith(`${prefix}?`)) return id;
  const query = id.includes("?") ? id.slice(id.indexOf("?") + 1) : "";
  if (new URLSearchParams(query).has("mode")) return id;
  return `${id}${id.includes("?") ? "&" : "?"}mode=client`;
}
