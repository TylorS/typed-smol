import { findTypedConfigRoot } from "@typed/app/config/loadTypedConfig";
import { typedVitePlugin } from "@typed/vite-plugin";
import * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { connect } from "node:net";
import type { PresetProperty } from "storybook/internal/types";
import type { IncomingMessage, ServerResponse } from "node:http";
import { fileURLToPath } from "node:url";
import type { InlineConfig, Plugin, PluginOption } from "vite";
import {
  DEFAULT_TYPED_STORYBOOK_OPTIONS,
  TYPED_STORYBOOK_FRAMEWORK,
  type TypedStorybookFramework,
  type TypedStorybookFrameworkOptions,
} from "./types.js";

export const addons = [] satisfies PresetProperty<"addons">;

let previewAnnotationVersion = 0;

export const core: PresetProperty<"core"> = async (config) => ({
  ...config,
  builder: {
    name: "@storybook/builder-vite",
    options: typeof config?.builder === "object" ? config.builder.options : {},
  },
  renderer: "@typed/storybook",
});

export const previewAnnotations = ((entry = []) => {
  const preview = typedPreviewAnnotation();
  return entry.some(isTypedPreviewAnnotation) ? entry : [...entry, preview];
}) satisfies PresetProperty<"previewAnnotations">;

export interface TypedStorybookPresetOptions {
  readonly presets?: {
    readonly apply: (extension: "framework") => Promise<TypedStorybookFramework>;
  };
}

const DEFAULT_STORYBOOK_HTTP_HOST = "127.0.0.1";
const DEFAULT_STORYBOOK_HTTP_PORT = 6174;
const DEFAULT_STORYBOOK_PROXY_PATH = "/__typed_storybook_api";
const DEFAULT_STORYBOOK_CHUNK_WARNING_LIMIT_KB = 1_500;
const TYPED_VITE_PATHS_PLUGIN = "typed-vite:native-tsconfig-paths";
const TYPED_STORYBOOK_HTTP_SERVER_PLUGIN = "typed-storybook:http-server";

type TypedStorybookHttpServerOptions = NonNullable<TypedStorybookFrameworkOptions["server"]> & {
  readonly mode: "http-server";
};

export type TypedStorybookHttpServerPlugin = Plugin & {
  readonly typedServerId: string;
};

export async function viteFinal(
  config: InlineConfig,
  options: TypedStorybookPresetOptions = {},
): Promise<InlineConfig> {
  const framework = await options.presets?.apply("framework");
  const frameworkOptions = getFrameworkOptions(framework);
  const serverOptions = frameworkOptions.server;
  const fallbackRoot = config.root ?? process.cwd();
  const projectRoot = findTypedConfigRoot(fallbackRoot) ?? fallbackRoot;
  const typedViteOptions = {
    ...frameworkOptions.typedVite,
    projectRoot,
    storybookVmOptions: {
      ...frameworkOptions.typedVite?.storybookVmOptions,
      runtimeDefaults: {
        ...frameworkOptions.typedVite?.storybookVmOptions?.runtimeDefaults,
        routes: serverOptions?.routes,
        api: serverOptions?.api,
        proxyPath: serverOptions?.proxyPath ?? DEFAULT_STORYBOOK_PROXY_PATH,
        baseDir: projectRoot,
      },
    },
  };
  const httpServerPlugin = isHttpServerOptions(serverOptions)
    ? maybeCreateHttpServerPlugin(config.plugins, serverOptions)
    : [];
  config.build = withStorybookBuildDefaults(config.build);
  config.plugins = [
    ...(config.plugins ?? []),
    ...maybeCreateTypedVitePlugins(config.plugins, typedViteOptions),
    ...httpServerPlugin,
  ] as PluginOption[];
  return config;
}

function withStorybookBuildDefaults(build: InlineConfig["build"]): InlineConfig["build"] {
  return {
    ...build,
    chunkSizeWarningLimit: build?.chunkSizeWarningLimit ?? DEFAULT_STORYBOOK_CHUNK_WARNING_LIMIT_KB,
    rolldownOptions: {
      ...build?.rolldownOptions,
      checks: {
        ...build?.rolldownOptions?.checks,
        pluginTimings: build?.rolldownOptions?.checks?.pluginTimings ?? false,
      },
    },
  };
}

function maybeCreateTypedVitePlugins(
  plugins: InlineConfig["plugins"],
  options: Parameters<typeof typedVitePlugin>[0],
): PluginOption[] {
  return hasPluginNamed(plugins, TYPED_VITE_PATHS_PLUGIN) ? [] : typedVitePlugin(options);
}

function maybeCreateHttpServerPlugin(
  plugins: InlineConfig["plugins"],
  options: TypedStorybookHttpServerOptions,
): readonly TypedStorybookHttpServerPlugin[] {
  const typedServerId = typedServerIdFromOptions(options);
  return hasTypedStorybookHttpServerPlugin(plugins, typedServerId)
    ? []
    : [createTypedStorybookHttpServerPlugin(options)];
}

function hasTypedStorybookHttpServerPlugin(
  plugins: InlineConfig["plugins"],
  typedServerId: string,
): boolean {
  return flattenPlugins(plugins).some(
    (plugin) =>
      plugin.name === TYPED_STORYBOOK_HTTP_SERVER_PLUGIN &&
      "typedServerId" in plugin &&
      plugin.typedServerId === typedServerId,
  );
}

function hasPluginNamed(plugins: InlineConfig["plugins"], name: string): boolean {
  return flattenPlugins(plugins).some((plugin) => plugin.name === name);
}

function flattenPlugins(plugins: InlineConfig["plugins"]): readonly Plugin[] {
  const flat: Plugin[] = [];
  const visit = (plugin: PluginOption) => {
    if (!plugin) return;
    if (Array.isArray(plugin)) {
      for (const child of plugin) visit(child);
      return;
    }
    if (typeof plugin === "object" && "name" in plugin) {
      flat.push(plugin as Plugin);
    }
  };
  for (const plugin of plugins ?? []) visit(plugin);
  return flat;
}

function isHttpServerOptions(
  options: TypedStorybookFrameworkOptions["server"] | undefined,
): options is TypedStorybookHttpServerOptions {
  return options?.mode === "http-server";
}

export function createTypedStorybookHttpServerPlugin(
  options: TypedStorybookHttpServerOptions,
): TypedStorybookHttpServerPlugin {
  const host = options.host ?? DEFAULT_STORYBOOK_HTTP_HOST;
  const port = options.port ?? DEFAULT_STORYBOOK_HTTP_PORT;
  const proxyPath = options.proxyPath ?? DEFAULT_STORYBOOK_PROXY_PATH;
  const typedServerId = typedServerIdFromOptions(options);
  let fiber: ReturnType<typeof Effect.runFork> | undefined;

  const stop = async () => {
    if (fiber) await Effect.runPromise(Fiber.interrupt(fiber));
    fiber = undefined;
  };

  return {
    name: "typed-storybook:http-server",
    typedServerId,
    configureServer(server) {
      let startPromise: Promise<void> | undefined;
      const start = async () => {
        if (startPromise) return startPromise;
        startPromise = startTypedHttpServer(server, typedServerId, host, port).then(
          (startedFiber) => {
            fiber = startedFiber;
          },
        );
        return startPromise;
      };
      server.middlewares.use((request, response, next) => {
        if (!isProxyRequest(request, proxyPath)) return next();
        void start()
          .then(() => proxyTypedRequest(request, response, `http://${host}:${port}`, proxyPath))
          .catch(next);
      });
      server.httpServer?.once("close", () => {
        void stop();
      });
      if (typeof server.close === "function") {
        const close = server.close.bind(server);
        server.close = async () => {
          await stop();
          await close();
        };
      }

      return undefined;
    },
    async closeBundle() {
      await stop();
    },
  };
}

async function startTypedHttpServer(
  server: ViteDevServerForTypedStorybook,
  typedServerId: string,
  host: string,
  port: number,
): Promise<ReturnType<typeof Effect.runFork>> {
  try {
    await server.pluginContainer.resolveId(typedServerId, serverImporter(server));
  } catch (error) {
    if (isClosedServerError(error)) return Effect.runFork(Effect.void);
    throw error;
  }
  const mod = (await server.ssrLoadModule(typedServerId)) as {
    readonly run?: (options: {
      readonly host: string;
      readonly port: number;
    }) => Effect.Effect<never, Error, never>;
  };
  if (typeof mod.run !== "function") {
    throw new TypeError(`Expected ${typedServerId} to export run()`);
  }
  const fiber = Effect.runFork(mod.run({ host, port }));
  await waitForServerPort(host, port);
  return fiber;
}

function isClosedServerError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: unknown }).code === "ERR_CLOSED_SERVER"
  );
}

function getFrameworkOptions(
  framework: TypedStorybookFramework | undefined,
): TypedStorybookFrameworkOptions {
  if (
    typeof framework === "object" &&
    framework.name === TYPED_STORYBOOK_FRAMEWORK &&
    framework.options
  ) {
    return framework.options;
  }

  return DEFAULT_TYPED_STORYBOOK_OPTIONS;
}

function isTypedPreviewAnnotation(annotation: string): boolean {
  return (
    annotation.includes("@typed/storybook/preview.js") ||
    annotation.endsWith("/dist/preview.js") ||
    annotation.endsWith("/dist/preview.js'")
  );
}

function typedPreviewAnnotation(): string {
  const resolved = import.meta.resolve("@typed/storybook/preview.js");
  const suffix = `?typed-storybook-preview=${previewAnnotationVersion++}`;
  if (resolved.startsWith("file:./") || resolved.startsWith("./")) {
    return `${fileURLToPath(new URL("./preview.js", import.meta.url))}${suffix}`;
  }
  if (resolved.startsWith("file:")) {
    return `${fileURLToPath(resolved)}${suffix}`;
  }
  return `${resolved}${suffix}`;
}

function typedServerIdFromOptions(options: TypedStorybookHttpServerOptions): string {
  const params = [
    ...(options.routes ?? []).map((route) => `routes=${route}`),
    ...(options.api ?? []).map((api) => `api=${api}`),
  ];
  return `typed:server?${params.join("&")}`;
}

function isProxyRequest(request: IncomingMessage, proxyPath: string): boolean {
  return (request.url ?? "").startsWith(proxyPath);
}

async function proxyTypedRequest(
  request: IncomingMessage,
  response: ServerResponse,
  serverOrigin: string,
  proxyPath: string,
): Promise<void> {
  const target = targetUrl(request.url ?? "/", serverOrigin, proxyPath);
  const upstream = await fetch(target, {
    method: request.method,
    headers: requestHeaders(request),
    body: requestHasBody(request) ? (request as AsyncIterable<Uint8Array>) : undefined,
    duplex: requestHasBody(request) ? "half" : undefined,
  } as RequestInit & { readonly duplex?: "half" });

  response.statusCode = upstream.status;
  response.statusMessage = upstream.statusText;
  upstream.headers.forEach((value, key) => response.setHeader(key, value));
  if (upstream.body === null) {
    response.end();
    return;
  }
  const body = Buffer.from(await upstream.arrayBuffer());
  response.end(body);
}

function targetUrl(url: string, serverOrigin: string, proxyPath: string): string {
  const stripped = url.slice(proxyPath.length) || "/";
  return new URL(stripped, serverOrigin).href;
}

function requestHeaders(request: IncomingMessage): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
      continue;
    }
    headers.set(key, value);
  }
  return headers;
}

function requestHasBody(request: IncomingMessage): boolean {
  return request.method !== "GET" && request.method !== "HEAD";
}

async function waitForServerPort(host: string, port: number): Promise<void> {
  const deadline = Date.now() + 10_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await connectToServerPort(host, port);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  throw new Error(`Timed out waiting for Typed Storybook HTTP server on ${host}:${port}`, {
    cause: lastError,
  });
}

function connectToServerPort(host: string, port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = connect({ host, port });
    socket.once("connect", () => {
      socket.end();
      resolve();
    });
    socket.once("error", reject);
  });
}

function serverImporter(server: Pick<ViteDevServerForTypedStorybook, "config">): string {
  return `${server.config.root}/typed-storybook.server.ts`;
}

interface ViteDevServerForTypedStorybook {
  readonly config: {
    readonly configFile?: string;
    readonly root: string;
  };
  readonly pluginContainer: {
    readonly resolveId: (id: string, importer?: string) => Promise<unknown>;
  };
  readonly ssrLoadModule: (id: string) => Promise<unknown>;
  close: () => Promise<void>;
}
