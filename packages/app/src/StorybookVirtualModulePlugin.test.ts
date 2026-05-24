import { describe, expect, it } from "vitest";
import { createStorybookVirtualModulePlugin } from "./StorybookVirtualModulePlugin.js";

const importer = "/project/src/story.ts";

function buildStorybook(
  id: string,
  options: Parameters<typeof createStorybookVirtualModulePlugin>[0] = {},
  importerPath = importer,
) {
  return createStorybookVirtualModulePlugin(options).build(id, importerPath, {} as never);
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
