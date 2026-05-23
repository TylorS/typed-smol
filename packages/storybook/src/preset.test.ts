import { describe, expect, it, vi } from "vitest";
import * as Effect from "effect/Effect";
import { createServer } from "node:http";
import type { InlineConfig, Plugin } from "vite";
import { TYPED_STORYBOOK_FRAMEWORK } from "./index.js";
import {
  createTypedStorybookHttpServerPlugin,
  previewAnnotations,
  viteFinal,
  type TypedStorybookHttpServerPlugin,
} from "./preset.js";

const pluginNames = (config: InlineConfig) =>
  (config.plugins ?? []).flat().map((plugin) => (plugin as Plugin).name);

describe("@typed/storybook preset", () => {
  it("adds the Typed preview annotations entry", () => {
    const annotations = previewAnnotations(["./user-preview.js"]);

    expect(annotations[0]).toBe("./user-preview.js");
    expect(annotations[1]).toMatch(/\/preview\.js(?:\?|$)/);
  });

  it("does not duplicate the Typed preview annotations entry", () => {
    const existing = "/project/node_modules/@typed/storybook/dist/preview.js";

    expect(previewAnnotations([existing])).toEqual([existing]);
  });

  it("preserves existing Vite plugins while appending typed plugins", async () => {
    const userPlugin = { name: "user-plugin" } satisfies Plugin;
    const baseConfig = { plugins: [userPlugin] } satisfies InlineConfig;

    const finalConfig = await viteFinal(baseConfig, {
      presets: {
        apply: async (extension) => {
          expect(extension).toBe("framework");
          return {
            name: TYPED_STORYBOOK_FRAMEWORK,
            options: {
              typedVite: {
                compression: false,
                serverEntry: false,
              },
            },
          };
        },
      },
    });

    expect(finalConfig).toBe(baseConfig);
    expect(pluginNames(finalConfig)).toEqual([
      "user-plugin",
      "typed-vite:native-tsconfig-paths",
      "typed-template",
      "virtual-modules",
    ]);
  });

  it("appends the HTTP server dev plugin when configured", async () => {
    const baseConfig = {} satisfies InlineConfig;

    const finalConfig = await viteFinal(baseConfig, {
      presets: {
        apply: async () => ({
          name: TYPED_STORYBOOK_FRAMEWORK,
          options: {
            typedVite: {
              compression: false,
              serverEntry: false,
            },
            server: {
              mode: "http-server",
              routes: ["./routes"],
              api: ["./api"],
              port: 6174,
              proxyPath: "/__typed_storybook_api",
            },
          },
        }),
      },
    });

    expect(pluginNames(finalConfig)).toEqual([
      "typed-vite:native-tsconfig-paths",
      "typed-template",
      "virtual-modules",
      "typed-storybook:http-server",
    ]);
  });

  it("builds a typed:server id from HTTP server options", () => {
    const plugin = createTypedStorybookHttpServerPlugin({
      mode: "http-server",
      routes: ["./routes", "./admin"],
      api: ["./api"],
    });

    expect(plugin.name).toBe("typed-storybook:http-server");
    expect(plugin).toMatchObject({
      typedServerId: "typed:server?routes=./routes&routes=./admin&api=./api",
    });
  });

  it("starts the generated typed:server module when the proxy is used", async () => {
    const upstream = createServer((_request, response) => {
      response.end("ok");
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (address === null || typeof address === "string") {
      throw new TypeError("Expected test HTTP server address");
    }
    const run = vi.fn(() => Effect.never);
    const ssrLoadModule = vi.fn(async () => ({ run }));
    const resolveId = vi.fn(async () => ({ id: "\0virtual:typed-server" }));
    const use = vi.fn();
    const once = vi.fn();
    const plugin = createTypedStorybookHttpServerPlugin({
      mode: "http-server",
      routes: ["./routes"],
      api: ["./api"],
      port: address.port,
    });

    const postConfigure = runConfigureServer(plugin, {
      middlewares: { use },
      httpServer: { once },
      config: { configFile: "/project/fixtures/public-beta/.storybook/main.ts", root: "/project" },
      pluginContainer: { resolveId },
      ssrLoadModule,
    } as never);

    expect(postConfigure).toBeUndefined();
    expect(use).toHaveBeenCalledOnce();
    expect(once).toHaveBeenCalledWith("close", expect.any(Function));

    const middleware = use.mock.calls[0]?.[0] as (
      request: { readonly url?: string; readonly method?: string; readonly headers: Record<string, string> },
      response: { statusCode?: number; statusMessage?: string; setHeader: () => void; end: () => void },
      next: (error?: unknown) => void,
    ) => void;
    await new Promise<void>((resolve, reject) => {
      middleware(
        {
          url: "/__typed_storybook_api/message",
          method: "GET",
          headers: {},
        },
        {
          setHeader: vi.fn(),
          end: vi.fn(() => {
            upstream.close();
            resolve();
          }),
        },
        reject,
      );
    });

    expect(resolveId).toHaveBeenCalledWith(
      "typed:server?routes=./routes&api=./api",
      "/project/typed-storybook.server.ts",
    );
    expect(ssrLoadModule).toHaveBeenCalledWith("typed:server?routes=./routes&api=./api");
    expect(run).toHaveBeenCalledWith({ host: "127.0.0.1", port: address.port });
  });
});

function runConfigureServer(
  plugin: TypedStorybookHttpServerPlugin,
  server: Parameters<NonNullable<Extract<TypedStorybookHttpServerPlugin["configureServer"], (...args: any) => any>>>[0],
) {
  const hook = plugin.configureServer;
  if (!hook) throw new TypeError("Expected configureServer hook");
  const handler = typeof hook === "function" ? hook : hook.handler;
  return handler.call({} as ThisParameterType<typeof handler>, server);
}
