/**
 * Tests for typedVitePlugin and createTypedViteResolver: plugin order and options pass-through.
 * See .docs/specs/httpapi-virtual-module-plugin/spec.md (Vite Plugin Integration Surface)
 * and testing-strategy.md (typedVitePlugin registration order and option wiring).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PluginManager } from "@typed/virtual-modules";
import type { VirtualModulePlugin } from "@typed/virtual-modules";
import {
  createTypedViteResolver,
  resolveTypedViteProjectRoot,
  typedVitePlugin,
  type HttpApiVirtualModulePluginOptions,
} from "./index.js";
import { createSsrRunnableEnvironment } from "./vaviteIntegration.js";

const COMPOSABLE_PLUGIN_NAMES = [
  "typed-services-virtual-module",
  "typed-guard-virtual-module",
  "typed-layout-virtual-module",
  "typed-catch-virtual-module",
  "typed-headers-virtual-module",
  "typed-errors-virtual-module",
  "typed-middlewares-virtual-module",
  "typed-prefix-virtual-module",
  "typed-openapi-virtual-module",
  "typed-route-template-virtual-module",
  "typed-api-handler-virtual-module",
  "typed-component-virtual-module",
] as const;

function fakeHttpApiPlugin(opts: HttpApiVirtualModulePluginOptions): VirtualModulePlugin {
  return {
    name: "httpapi-virtual-module",
    shouldResolve: () => false,
    build: () => "",
    _testOpts: opts,
  } as VirtualModulePlugin & { _testOpts: HttpApiVirtualModulePluginOptions };
}

describe("createTypedViteResolver", () => {
  it("always registers all app VM plugins", () => {
    const resolver = createTypedViteResolver({});
    expect(resolver).toBeInstanceOf(PluginManager);
    const manager = resolver as PluginManager;
    expect(manager.plugins.map((plugin) => plugin.name)).toEqual([
      "router-virtual-module",
      "route-handlers-virtual-module",
      ...COMPOSABLE_PLUGIN_NAMES,
      "httpapi-virtual-module",
      "typed-env-virtual-module",
      "typed-config-virtual-module",
      "typed-html-virtual-module",
      "typed-server-virtual-module",
      "typed-browser-virtual-module",
      "typed-storybook-virtual-module",
    ]);
  });

  it("uses DI override for HttpApi plugin when provided", () => {
    const resolver = createTypedViteResolver(
      { apiVmOptions: { prefix: "typed:custom-api" } },
      { createHttpApiVirtualModulePlugin: fakeHttpApiPlugin },
    );
    const manager = resolver as PluginManager;
    expect(manager.plugins).toHaveLength(21);
    expect(manager.plugins[0].name).toBe("router-virtual-module");
    expect(manager.plugins[1].name).toBe("route-handlers-virtual-module");
    const apiPlugin = manager.plugins.find((plugin) => plugin.name === "httpapi-virtual-module") as
      | (VirtualModulePlugin & { _testOpts: HttpApiVirtualModulePluginOptions })
      | undefined;
    expect(apiPlugin).toBeDefined();
    expect(apiPlugin!._testOpts).toEqual({ prefix: "typed:custom-api" });
  });

  it("passes apiVmOptions through to createHttpApiVirtualModulePlugin", () => {
    const opts: HttpApiVirtualModulePluginOptions = { custom: "value", count: 1 };
    const resolver = createTypedViteResolver(
      { apiVmOptions: opts },
      { createHttpApiVirtualModulePlugin: fakeHttpApiPlugin },
    );
    const manager = resolver as PluginManager;
    const apiPlugin = manager.plugins.find((plugin) => plugin.name === "httpapi-virtual-module") as
      | (VirtualModulePlugin & { _testOpts: HttpApiVirtualModulePluginOptions })
      | undefined;
    expect(apiPlugin).toBeDefined();
    expect(apiPlugin!._testOpts).toEqual(opts);
  });

  it("uses routerVmOptions for the router plugin", () => {
    const resolver = createTypedViteResolver({
      routerVmOptions: { prefix: "routes:", name: "custom-router" },
    });
    const manager = resolver as PluginManager;
    expect(manager.plugins).toHaveLength(21);
    expect(manager.plugins[0].name).toBe("custom-router");
    expect(manager.plugins[1].name).toBe("route-handlers-virtual-module");
    expect(manager.plugins.map((plugin) => plugin.name)).toContain("httpapi-virtual-module");
  });

  it("uses componentVmOptions for the component plugin", () => {
    const resolver = createTypedViteResolver({
      componentVmOptions: { prefix: "typed:ui-component", name: "custom-component" },
    });
    const manager = resolver as PluginManager;

    expect(manager.plugins.map((plugin) => plugin.name)).toContain("custom-component");
  });

  it("passes app topology defaults to app virtual module plugins", () => {
    const resolver = createTypedViteResolver({
      browserVmOptions: {
        runtimeDefaults: { base: "/app", root: "#shell", routes: ["./pages"] },
      },
      htmlVmOptions: { defaultOutlet: "<!--app-->", defaultPath: "./shell.html" },
      storybookVmOptions: {
        runtimeDefaults: { api: ["./api"], proxyPath: "/__api", routes: ["./pages"] },
      },
    });
    const manager = resolver as PluginManager;
    const html = manager.plugins.find((plugin) => plugin.name === "typed-html-virtual-module")!;
    const browser = manager.plugins.find((plugin) => plugin.name === "typed-browser-virtual-module")!;
    const storybook = manager.plugins.find((plugin) => plugin.name === "typed-storybook-virtual-module")!;

    expect(html.build("typed:html", "/project/src/entry.ts", {} as never)).toMatchInlineSnapshot(`
      "import { readFile } from "node:fs/promises";
      import * as TypedConfigModule from "typed:config";
      interface LoadHtmlOptions {
        readonly readFile?: (path: string, encoding: "utf8") => Promise<string>;
        readonly dev?: boolean;
        readonly devServer?: { readonly transformIndexHtml: (url: string, html: string) => string | Promise<string> };
        readonly url?: string;
      }
      type TypedConfigBuildOptions = {
        readonly build?: {
          readonly outDir?: string;
          readonly clientOutDir?: string;
        };
      };
      const sourceHtmlPath = "./shell.html";
      const typedConfig = TypedConfigModule as TypedConfigBuildOptions;
      const typedBuildConfig = typedConfig.build ?? {};
      const builtHtmlPath = joinClientBuildPath(sourceHtmlPath);
      const outlet = "<!--app-->";
      export const html = sourceHtmlPath;
      function joinClientBuildPath(sourcePath: string): string {
        const clientOutDir = typedBuildConfig.clientOutDir ?? joinPath(typedBuildConfig.outDir ?? "dist", "client");
        return joinPath(clientOutDir, normalizeClientHtmlPath(sourcePath));
      }
      function normalizeClientHtmlPath(sourcePath: string): string {
        return sourcePath.split("/").filter(isClientHtmlPathSegment).join("/");
      }
      function isClientHtmlPathSegment(segment: string): boolean {
        return segment !== "" && segment !== "." && segment !== "..";
      }
      function joinPath(...parts: readonly string[]): string {
        return parts.flatMap((part) => part.split("/")).filter(Boolean).join("/");
      }
      export async function loadHtml(options: LoadHtmlOptions = {}) {
        const read = options.readFile ?? readFile;
        if (options.dev && options.devServer) {
          const source = await read(sourceHtmlPath, "utf8");
          return options.devServer.transformIndexHtml(options.url ?? "/", source);
        }
        return read(builtHtmlPath, "utf8");
      }
      export function renderHtml(template: string, markup: string): string {
        if (template.includes(outlet)) return template.replace(outlet, markup);
        const bodyMatch = /<body\\b[^>]*>/i.exec(template);
        if (!bodyMatch) return \`\${template}\${markup}\`;
        const insertAt = bodyMatch.index + bodyMatch[0].length;
        return \`\${template.slice(0, insertAt)}\${markup}\${template.slice(insertAt)}\`;
      }"
    `);
    expect(browser.build("typed:browser", "/project/src/entry.ts", {} as never)).toMatchInlineSnapshot(`
      "import * as Cause from "effect/Cause";
      import * as Effect from "effect/Effect";
      import * as Layer from "effect/Layer";
      import { composeWithLayers, mount as mountRuntime, type ComputeLayers, type LayerOrGroup } from "@typed/app/runtime";
      import * as TypedRouter from "@typed/router";
      import Routes0 from "typed:router?dir=./pages";
      type BrowserLayer<ROut, E, RIn> = Layer.Layer<ROut, E, RIn>;
      type BrowserLayerInputs = readonly LayerOrGroup[];
      type BrowserBaseLayer = ReturnType<typeof makeRenderLayer>;
      type BrowserCompanionLayers = typeof companionLayers;
      type BrowserAllLayers<Layers extends BrowserLayerInputs> = readonly [...BrowserCompanionLayers, ...Layers];
      type BrowserLayerWith<Layers extends BrowserLayerInputs> = ComputeLayers<BrowserAllLayers<Layers>, BrowserBaseLayer>;
      type BrowserHydratedLayer<Layers extends BrowserLayerInputs> = BrowserLayerWith<Layers>;
      type BrowserRunEffect<Layers extends BrowserLayerInputs> = Effect.Effect<never, Layer.Error<BrowserHydratedLayer<Layers>>, Layer.Services<BrowserHydratedLayer<Layers>>>;
      type BrowserErrorHandler<E> = (cause: Cause.Cause<E>) => void | Effect.Effect<void, never, never>;
      interface BrowserOptions<Layers extends BrowserLayerInputs = readonly []> {
        readonly window?: Window;
        readonly root?: string | HTMLElement;
        readonly layers?: Layers;
        readonly onError?: BrowserErrorHandler<Layer.Error<BrowserLayerWith<Layers>>>;
      }
      type BrowserOptionsWithLayers<Layers extends BrowserLayerInputs> = BrowserOptions<Layers> & { readonly layers: Layers };
      const routeModules = [Routes0];
      const companionLayers = [] as const;
      const companionOnError = undefined;
      export const Routes = Routes0;
      export const BrowserRuntime = {
        routeModules,
        root: "#shell",
        base: "/app",
        name: undefined,
        companionLayers,
      };
      function makeRenderLayer(win: Window, root: HTMLElement) {
        return Layer.effectDiscard(mountRuntime(Routes, { root })).pipe(
          Layer.provideMerge(TypedRouter.BrowserRouter(win)),
        );
      }
      export function hydrate(options?: BrowserOptions<readonly []>): BrowserLayerWith<readonly []>;
      export function hydrate<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): BrowserLayerWith<Layers>;
      export function hydrate(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserHydratedLayer<BrowserLayerInputs> {
        return hydrateFromOptions(options);
      }
      function hydrateFromOptions(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs>) {
        const win = options.window ?? window;
        const root = resolveRoot(options.root ?? BrowserRuntime.root, win.document);
        const renderLayer = makeRenderLayer(win, root);
        return options.layers === undefined ? renderLayer : composeWithLayers(renderLayer, options.layers);
      }
      export function run(options?: BrowserOptions<readonly []>): BrowserRunEffect<readonly []>;
      export function run<const Layers extends BrowserLayerInputs>(options: BrowserOptionsWithLayers<Layers>): Effect.Effect<never, Layer.Error<BrowserLayerWith<Layers>>, Layer.Services<BrowserLayerWith<Layers>>>;
      export function run(options: BrowserOptions<readonly []> | BrowserOptionsWithLayers<BrowserLayerInputs> = {}): BrowserRunEffect<BrowserLayerInputs> {
        const BrowserLayer = hydrateFromOptions(options);
        const program = withErrorHandling(Layer.launch(BrowserLayer), options.onError);
        return program;
      }
      function resolveRoot(root: string | HTMLElement, document: Document): HTMLElement {
        if (typeof root !== "string") return root;
        const element = document.querySelector(root);
        if (element instanceof HTMLElement) return element;
        throw new Error(\`typed:browser root not found: \${root}\`);
      }
      function withErrorHandling<A, E, R>(program: Effect.Effect<A, E, R>, onError: BrowserErrorHandler<E> | undefined): Effect.Effect<A, E, R> {
        const handler = onError ?? companionOnError;
        return handler ? program.pipe(Effect.tapCause((cause) => callErrorHandler(handler, cause))) : program;
      }
      function callErrorHandler<E>(handler: BrowserErrorHandler<E>, cause: Cause.Cause<E>): Effect.Effect<void, never, never> {
        const result = handler(cause);
        return Effect.isEffect(result) ? result : Effect.void;
      }"
    `);
    expect(
      storybook.build("typed:storybook/runtime", "/project/src/story.ts", {} as never),
    ).toMatchInlineSnapshot(`
      "import * as Layer from "effect/Layer";
      import type { LayerOrGroup } from "@typed/app/runtime";
      import { defineTypedStoryRuntime } from "@typed/storybook";
      import * as TypedRouter from "@typed/router";
      import Routes0 from "typed:router?dir=./pages";
      import * as Api0 from "typed:api?dir=./api&mode=client";
      export const routeModules = [Routes0] as const;
      export const apiModules = [Api0] as const;
      export const apiLayers = [Api0.DependenciesLayer] as const;
      export const serverOrigin = undefined;
      export const proxyPath = "/__api";
      export const apiBaseUrl = serverOrigin === undefined ? proxyPath : new URL(proxyPath, serverOrigin).href;
      export const Routes = Routes0;
      export const DependenciesLayer = Layer.mergeAll(Layer.empty, ...apiLayers);
      const generatedLayers = [DependenciesLayer] as const;
      interface StoryRuntimeOptions {
        readonly layers?: readonly LayerOrGroup[];
        readonly testLayers?: readonly LayerOrGroup[];
      }
      export function makeStoryRuntime<const Options extends StoryRuntimeOptions = {}>(
        options: Options = {} as Options,
      ) {
        return defineTypedStoryRuntime({
          path: "/",
          routes: ["./pages"],
          api: ["./api"],
          serverOrigin: undefined,
          proxyPath: "/__api",
          ...options,
          layers: [...generatedLayers, ...(options.layers ?? [])] as const,
        });
      }
      export const parameters = { typed: makeStoryRuntime() };
      "
    `);
  });
});

describe("typedVitePlugin", () => {
  it("prefers the typed.config.ts directory as the project root", () => {
    const root = mkdtempSync(join(tmpdir(), "typed-vite-root-"));
    const nested = join(root, "apps", "web");
    mkdirSync(nested, { recursive: true });
    writeFileSync(join(root, "typed.config.ts"), "export default {};");

    try {
      expect(resolveTypedViteProjectRoot(nested)).toBe(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("imports @typed/app helpers through narrow subpaths", () => {
    const source = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

    expect(source).toMatchInlineSnapshot(`
      "/**
       * @typed/vite-plugin — One-stop Vite preset: tsconfig paths, bundle analyzer,
       * Brotli compression, virtual-modules Vite plugin, and @typed/app VM plugins.
       */
      import {
        type BrowserVirtualModulePluginOptions,
      } from "@typed/app/BrowserVirtualModulePlugin";
      import {
        type ComponentVirtualModulePluginOptions,
      } from "@typed/app/ComponentVirtualModulePlugin";
      import {
        type HtmlVirtualModulePluginOptions,
      } from "@typed/app/HtmlVirtualModulePlugin";
      import {
        type HttpApiVirtualModulePluginOptions,
      } from "@typed/app/HttpApiVirtualModulePlugin";
      import {
        type RouterVirtualModulePluginOptions,
      } from "@typed/app/RouterVirtualModulePlugin";
      import {
        type StorybookVirtualModulePluginOptions,
      } from "@typed/app/StorybookVirtualModulePlugin";
      import { createTypedVirtualModulePlugins } from "@typed/app/TypedVirtualModulePlugins";
      import type { TypedConfig } from "@typed/app/config/TypedConfig";
      import { findTypedConfigRoot, loadTypedConfig } from "@typed/app/config/loadTypedConfig";
      import {
        typedTemplateVitePlugin,
        type TypedTemplateVitePluginOptions,
      } from "@typed/compiler";
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
          apiVmOptions: config.api || config.openapi
            ? { prefix: config.api?.prefix, pathPrefix: config.api?.pathPrefix, openapi: config.openapi }
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

      function loadTypedViteOptions(
        options: TypedVitePluginOptions | undefined,
      ): { readonly options: TypedVitePluginOptions; readonly projectRoot: string } {
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
       * Use as: \`defineConfig({ plugins: typedVitePlugin() })\`.
       *
       * When called with no arguments, auto-discovers \`typed.config.ts\` in the project root.
       * When called with explicit options, those take full precedence (config file is not loaded).
       */
      export function typedVitePlugin(options?: TypedVitePluginOptions): Plugin[] {
        const loaded = loadTypedViteOptions(options);
        const resolvedOptions = loaded.options;
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
        if (id !== prefix && !id.startsWith(\`\${prefix}?\`)) return id;
        const query = id.includes("?") ? id.slice(id.indexOf("?") + 1) : "";
        if (new URLSearchParams(query).has("mode")) return id;
        return \`\${id}\${id.includes("?") ? "&" : "?"}mode=client\`;
      }
      "
    `);
  });

  it("returns a non-empty plugin array", () => {
    const plugins = typedVitePlugin();
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.length).toBeGreaterThan(0);
  });

  it("enables Vite-native tsconfig path resolution without vite-tsconfig-paths", () => {
    const plugins = typedVitePlugin({ compression: false });
    const tsconfigPlugin = plugins.find(
      (plugin) => (plugin as { name?: string }).name === "typed-vite:native-tsconfig-paths",
    );
    const config = {};

    expect(
      plugins.some((plugin) => (plugin as { name?: string }).name === "vite-tsconfig-paths"),
    ).toBe(false);
    expect(tsconfigPlugin).toBeDefined();
    (tsconfigPlugin as { config: (config: Record<string, any>) => void }).config(config);
    expect(config).toEqual({ resolve: { tsconfigPaths: true } });
  });

  it("does not configure native tsconfig path resolution when disabled", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });

    expect(
      plugins.some(
        (plugin) => (plugin as { name?: string }).name === "typed-vite:native-tsconfig-paths",
      ),
    ).toBe(false);
  });

  it("returns virtual-modules plugin with resolveId and load", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });
    const virtualPlugin = plugins.find(
      (p) =>
        p &&
        typeof p === "object" &&
        "name" in p &&
        (p as { name?: string }).name === "virtual-modules",
    );
    expect(virtualPlugin).toBeDefined();
  });

  it("registers the template transform before virtual modules", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });
    const names = plugins.map((plugin) => (plugin as { name?: string }).name);

    expect(names.indexOf("typed-template")).toBeGreaterThanOrEqual(0);
    expect(names.indexOf("typed-template")).toBeLessThan(names.indexOf("virtual-modules"));
  });

  it("does not register the template transform when disabled", () => {
    const plugins = typedVitePlugin({
      compression: false,
      templates: false,
      tsconfigPaths: false,
    });

    expect(plugins.map((plugin) => (plugin as { name?: string }).name)).not.toContain(
      "typed-template",
    );
  });

  it("auto-creates LS-backed session when createTypeInfoApiSession is not provided", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });
    const virtualPlugin = plugins.find(
      (p) =>
        p &&
        typeof p === "object" &&
        "name" in p &&
        (p as { name?: string }).name === "virtual-modules",
    );
    expect(virtualPlugin).toBeDefined();
    expect(virtualPlugin).toHaveProperty("resolveId");
    expect(virtualPlugin).toHaveProperty("load");
  });

  it("does not add vavite when no server entry is configured", () => {
    const plugins = typedVitePlugin({ tsconfigPaths: false, compression: false });

    expect(plugins.some((plugin) => (plugin as { name?: string }).name === "vavite")).toBe(false);
  });

  it("adds vavite when serverEntry is configured", () => {
    const plugins = typedVitePlugin({
      tsconfigPaths: false,
      compression: false,
      serverEntry: "/src/entry.server.ts",
    });

    expect(plugins.some((plugin) => (plugin as { name?: string }).name === "vavite")).toBe(true);
  });

  it("configures the ssr environment as runnable for vavite dev entries", () => {
    const plugins = typedVitePlugin({
      tsconfigPaths: false,
      compression: false,
      serverEntry: "/src/entry.server.ts",
    });
    const runnablePlugin = plugins.find(
      (plugin) => (plugin as { name?: string }).name === "typed-vavite:ssr-runnable-environment",
    );
    const config = {};

    expect(runnablePlugin).toBeDefined();
    (runnablePlugin as { config: (config: Record<string, any>) => void }).config(config);

    expect(config).toEqual({
      environments: {
        ssr: {
          dev: {
            createEnvironment: createSsrRunnableEnvironment,
          },
        },
      },
    });
  });

  it("does not apply vavite while Vite is running tests", () => {
    const plugins = typedVitePlugin({
      tsconfigPaths: false,
      compression: false,
      serverEntry: "/src/entry.server.ts",
    });
    const vavitePlugin = plugins.find((plugin) => (plugin as { name?: string }).name === "vavite");
    const apply = (vavitePlugin as { apply?: unknown } | undefined)?.apply;

    expect(typeof apply).toBe("function");
    expect(
      (apply as (config: unknown, env: { readonly mode: string }) => boolean)({}, { mode: "test" }),
    ).toBe(false);
    expect(
      (apply as (config: unknown, env: { readonly mode: string }) => boolean)(
        {},
        { mode: "development" },
      ),
    ).toBe(true);
  });
});
