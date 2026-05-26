import { describe, expect, it } from "vitest";
import { createStorybookVirtualModulePlugin } from "./StorybookVirtualModulePlugin.js";
import type { VirtualModuleBuildContext } from "@typed/virtual-modules";

const importer = "/project/src/story.ts";

function buildStorybook(
  id: string,
  options: Parameters<typeof createStorybookVirtualModulePlugin>[0] = {},
  importerPath = importer,
  context?: VirtualModuleBuildContext,
) {
  return createStorybookVirtualModulePlugin(options).build(id, importerPath, {} as never, context);
}

function productionContext(id: string, names: readonly string[]): VirtualModuleBuildContext {
  return {
    id,
    rootImporter: importer,
    containingFile: importer,
    consumer: "client",
    requestedExports: {
      kind: "names",
      names: new Set(names),
      typeOnlyNames: new Set(),
    },
    closure: {
      kind: "partial",
      requested: new Set(names),
      pluginDeclared: new Set(),
      typeInfoReachable: new Set(),
      routeOrAppReachable: new Set(),
    },
  };
}

describe("StorybookVirtualModulePlugin", () => {
  it("resolves typed:storybook modules", () => {
    const plugin = createStorybookVirtualModulePlugin();

    expect(plugin.shouldResolve("typed:storybook/preview", importer)).toBe(true);
    expect(plugin.shouldResolve("typed:storybook/testing", importer)).toBe(true);
    expect(plugin.shouldResolve("typed:storybook/runtime?routes=./routes", importer)).toBe(true);
    expect(plugin.shouldResolve("typed:router?dir=./routes", importer)).toBe(false);
  });

  it("emits preview and testing helpers", () => {
    expect(buildStorybook("typed:storybook/preview")).toMatchInlineSnapshot(`
      "export { default, projectAnnotations, renderToCanvas } from "@typed/storybook/preview.js";
      "
    `);
    expect(buildStorybook("typed:storybook/testing")).toMatchInlineSnapshot(`
      "export { composeStories, composeStory, setProjectAnnotations } from "@typed/storybook/testing";
      export { default as projectAnnotations } from "@typed/storybook/preview.js";
      "
    `);
  });

  it("emits runtime imports for route and api targets", () => {
    const source = buildStorybook(
      "typed:storybook/runtime?routes=./routes&routes=./admin&api=./api&path=/dashboard&serverOrigin=http%3A%2F%2F127.0.0.1%3A6174&proxyPath=%2F__typed_storybook_api",
    ) as string;

    expect(source).toMatchInlineSnapshot(`
      "import * as Layer from "effect/Layer";
      import type { LayerOrGroup } from "@typed/app/runtime";
      import { defineTypedStoryRuntime } from "@typed/storybook";
      import * as TypedRouter from "@typed/router";
      import Routes0 from "typed:router?dir=./routes";
      import Routes1 from "typed:router?dir=./admin";
      import * as Api0 from "typed:api?dir=./api&mode=client";
      export const routeModules = [Routes0, Routes1] as const;
      export const apiModules = [Api0] as const;
      export const apiLayers = [Api0.DependenciesLayer] as const;
      export const makeClient = Api0.makeClient;
      export const makeClientWith = Api0.makeClientWith;
      export const serverOrigin = "http://127.0.0.1:6174";
      export const proxyPath = "/__typed_storybook_api";
      export const apiBaseUrl = serverOrigin === undefined ? proxyPath : new URL(proxyPath, serverOrigin).href;
      export const Routes = TypedRouter.merge(Routes0, Routes1);
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
          path: "/dashboard",
          routes: ["./routes","./admin"],
          api: ["./api"],
          serverOrigin: "http://127.0.0.1:6174",
          proxyPath: "/__typed_storybook_api",
          ...options,
          layers: [...generatedLayers, ...(options.layers ?? [])] as const,
        });
      }
      export const parameters = { typed: makeStoryRuntime() };
      "
    `);
  });

  it("keeps raw client helper exports stable when no api targets are configured", () => {
    const source = buildStorybook("typed:storybook/runtime?routes=./routes&path=/dashboard") as string;

    expect(source).toContain('import type * as HttpClient from "effect/unstable/http/HttpClient";');
    expect(source).toContain(
      "export const makeClient = (_options?: { readonly baseUrl?: URL | string }) => {",
    );
    expect(source).toContain("export const makeClientWith = <E, R>(");
    expect(source).toContain("_httpClient: HttpClient.HttpClient.With<E, R>,");
    expect(source).toContain("_options?: { readonly baseUrl?: URL | string },");
    expect(source).toContain('throw new Error("Storybook runtime has no api targets configured");');
    expect(source).not.toContain(["make", "Typed", "Client"].join(""));
  });

  it("omits route and layer imports when production output requests only makeClient", () => {
    const id = "typed:storybook/runtime?routes=./routes&api=./api&path=/dashboard";
    const source = buildStorybook(id, {}, importer, productionContext(id, ["makeClient"])) as string;

    expect(source).toContain('import * as Api0 from "typed:api?dir=./api&mode=client";');
    expect(source).toContain("export const makeClient = Api0.makeClient;");
    expect(source).not.toContain('import * as Layer from "effect/Layer";');
    expect(source).not.toContain('import * as TypedRouter from "@typed/router";');
    expect(source).not.toContain('import Routes0 from "typed:router?dir=./routes";');
    expect(source).not.toContain("export const makeClientWith");
    expect(source).not.toContain("export const routeModules");
    expect(source).not.toContain("export const apiLayers");
    expect(source).not.toContain("export const DependenciesLayer");
    expect(source).not.toContain("export function makeStoryRuntime");
    expect(source).not.toContain("export const parameters");
  });

  it("imports only the primary api target when production output requests only makeClient", () => {
    const id = "typed:storybook/runtime?api=./api&api=./admin-api&path=/dashboard";
    const source = buildStorybook(id, {}, importer, productionContext(id, ["makeClient"])) as string;

    expect(source).toContain('import * as Api0 from "typed:api?dir=./api&mode=client";');
    expect(source).toContain("export const makeClient = Api0.makeClient;");
    expect(source).not.toContain('import * as Api1 from "typed:api?dir=./admin-api&mode=client";');
    expect(source).not.toContain("export const apiModules");
    expect(source).not.toContain("export const apiLayers");
  });

  it("emits pruned DependenciesLayer without requiring an apiLayers export", () => {
    const id = "typed:storybook/runtime?api=./api&path=/dashboard";
    const source = buildStorybook(
      id,
      {},
      importer,
      productionContext(id, ["DependenciesLayer"]),
    ) as string;

    expect(source).toContain('import * as Layer from "effect/Layer";');
    expect(source).toContain('import * as Api0 from "typed:api?dir=./api&mode=client";');
    expect(source).toContain(
      "export const DependenciesLayer = Layer.mergeAll(Layer.empty, ...[Api0.DependenciesLayer]);",
    );
    expect(source).not.toContain("export const apiLayers");
    expect(source).not.toContain("...apiLayers");
  });

  it("omits the router merge import for single-route pruned Routes output", () => {
    const id = "typed:storybook/runtime?routes=./routes&path=/dashboard";
    const source = buildStorybook(id, {}, importer, productionContext(id, ["Routes"])) as string;

    expect(source).toContain('import Routes0 from "typed:router?dir=./routes";');
    expect(source).toContain("export const Routes = Routes0;");
    expect(source).not.toContain('import * as TypedRouter from "@typed/router";');
  });

  it("omits the router merge import for no-route pruned Routes output", () => {
    const id = "typed:storybook/runtime?path=/dashboard";
    const source = buildStorybook(id, {}, importer, productionContext(id, ["Routes"])) as string;

    expect(source).toContain("export const Routes = undefined;");
    expect(source).not.toContain('import * as TypedRouter from "@typed/router";');
    expect(source).not.toContain("typed:router?dir=");
  });

  it("omits the HttpClient type import for no-api makeClient-only output", () => {
    const id = "typed:storybook/runtime?path=/dashboard";
    const source = buildStorybook(id, {}, importer, productionContext(id, ["makeClient"])) as string;

    expect(source).toContain(
      "export const makeClient = (_options?: { readonly baseUrl?: URL | string }) => {",
    );
    expect(source).not.toContain('import type * as HttpClient from "effect/unstable/http/HttpClient";');
    expect(source).not.toContain("export const makeClientWith");
  });

  it("emits short runtime imports from plugin defaults", () => {
    const source = buildStorybook(
      "typed:storybook/runtime?path=/dashboard",
      {
        runtimeDefaults: {
          routes: ["./src/routes"],
          api: ["./src/api"],
          proxyPath: "/__typed_storybook_api",
          baseDir: "/project",
        },
      },
      "/project/src/PublicBeta.stories.ts",
    ) as string;

    expect(source).toMatchInlineSnapshot(`
      "import * as Layer from "effect/Layer";
      import type { LayerOrGroup } from "@typed/app/runtime";
      import { defineTypedStoryRuntime } from "@typed/storybook";
      import * as TypedRouter from "@typed/router";
      import Routes0 from "typed:router?dir=./routes";
      import * as Api0 from "typed:api?dir=./api&mode=client";
      export const routeModules = [Routes0] as const;
      export const apiModules = [Api0] as const;
      export const apiLayers = [Api0.DependenciesLayer] as const;
      export const makeClient = Api0.makeClient;
      export const makeClientWith = Api0.makeClientWith;
      export const serverOrigin = undefined;
      export const proxyPath = "/__typed_storybook_api";
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
          path: "/dashboard",
          routes: ["./routes"],
          api: ["./api"],
          serverOrigin: undefined,
          proxyPath: "/__typed_storybook_api",
          ...options,
          layers: [...generatedLayers, ...(options.layers ?? [])] as const,
        });
      }
      export const parameters = { typed: makeStoryRuntime() };
      "
    `);
  });

  it("composes generated layers before story layers and leaves test layers last", () => {
    const source = buildStorybook("typed:storybook/runtime?routes=./routes&api=./api") as string;

    expect(source).toMatchInlineSnapshot(`
      "import * as Layer from "effect/Layer";
      import type { LayerOrGroup } from "@typed/app/runtime";
      import { defineTypedStoryRuntime } from "@typed/storybook";
      import * as TypedRouter from "@typed/router";
      import Routes0 from "typed:router?dir=./routes";
      import * as Api0 from "typed:api?dir=./api&mode=client";
      export const routeModules = [Routes0] as const;
      export const apiModules = [Api0] as const;
      export const apiLayers = [Api0.DependenciesLayer] as const;
      export const makeClient = Api0.makeClient;
      export const makeClientWith = Api0.makeClientWith;
      export const serverOrigin = undefined;
      export const proxyPath = "/__typed_storybook_api";
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
          routes: ["./routes"],
          api: ["./api"],
          serverOrigin: undefined,
          proxyPath: undefined,
          ...options,
          layers: [...generatedLayers, ...(options.layers ?? [])] as const,
        });
      }
      export const parameters = { typed: makeStoryRuntime() };
      "
    `);
  });
});
